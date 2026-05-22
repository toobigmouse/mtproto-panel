import { useState, FormEvent } from 'react';
import { Dialog, Button, TextInput, Alert, Select, RadioButton, Tooltip, Icon } from '@gravity-ui/uikit';
import { CircleQuestion } from '@gravity-ui/icons';
import { createProxy, NodeData } from '../api';

interface Props {
  open: boolean;
  onClose: () => void;
  nodeId?: number;
  nodes?: NodeData[];
  onCreated: () => void;
}

export default function AddProxyDialog({ open, onClose, nodeId, nodes, onCreated }: Props) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodeId ? nodeId.toString() : '');
  const [domain, setDomain] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [tag, setTag] = useState('');
  const [maxConnections, setMaxConnections] = useState('');
  const [listenPort, setListenPort] = useState('');
  const [outboundMode, setOutboundMode] = useState<'vpn' | 'tunnel'>('vpn');
  const [vpnSubscription, setVpnSubscription] = useState('');
  const [natIp, setNatIp] = useState('');
  const [tunnelInterface, setTunnelInterface] = useState('');
  const [maskHost, setMaskHost] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const targetNodeId = nodeId || parseInt(selectedNodeId, 10);
    if (!targetNodeId) {
      setError('Выберите ноду');
      return;
    }

    setLoading(true);

    try {
      await createProxy(targetNodeId, {
        domain: domain || undefined,
        tag: tag || undefined,
        name: name || undefined,
        note: note || undefined,
        maxConnections: maxConnections ? parseInt(maxConnections, 10) : undefined,
        listenPort: listenPort ? parseInt(listenPort, 10) : undefined,
        vpnSubscription: outboundMode === 'vpn' ? (vpnSubscription || undefined) : undefined,
        natIp: outboundMode === 'tunnel' ? (natIp || undefined) : undefined,
        tunnelInterface: outboundMode === 'tunnel' ? (tunnelInterface || undefined) : undefined,
        maskHost: maskHost || undefined,
      });
      setDomain('');
      setName('');
      setNote('');
      setTag('');
      setMaxConnections('');
      setListenPort('');
      setVpnSubscription('');
      setNatIp('');
      setTunnelInterface('');
      setMaskHost('');
      setSelectedNodeId(nodeId ? nodeId.toString() : '');
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} size="m">
      <Dialog.Header caption="Добавить прокси" />
      <Dialog.Body>
        <form onSubmit={handleSubmit} id="add-proxy-form">
          {error && (
            <div style={{ marginBottom: 16 }}>
              <Alert theme="danger" message={error} />
            </div>
          )}
          {!nodeId && nodes && (
            <div className="dialog-field">
              <label>Нода *</label>
              <Select
                value={selectedNodeId ? [selectedNodeId] : []}
                onUpdate={(val) => setSelectedNodeId(val[0] || '')}
                placeholder="Выберите ноду"
                width="max"
                options={nodes.map((n) => ({ value: n.id.toString(), content: `${n.name} (${n.ip})` }))}
              />
            </div>
          )}
          <div className="dialog-field">
            <label>Название (необязательно)</label>
            <TextInput value={name} onUpdate={setName} placeholder="Мой прокси" size="l" />
          </div>
          <div className="dialog-field">
            <label>Заметка (необязательно)</label>
            <TextInput value={note} onUpdate={setNote} placeholder="Описание" size="l" />
          </div>
          <div className="dialog-field">
            <label>Fake TLS домен (необязательно, из пула)</label>
            <TextInput value={domain} onUpdate={setDomain} placeholder="напр. www.google.com" size="l" />
          </div>
          <div className="dialog-field">
            <label>Промо тег (необязательно)</label>
            <TextInput value={tag} onUpdate={setTag} placeholder="Опционально" size="l" />
          </div>
          <div className="dialog-field">
            <label>Лимит подключений (0 = без лимита)</label>
            <TextInput value={maxConnections} onUpdate={setMaxConnections} placeholder="0" size="l" type="number" />
          </div>
          <div className="dialog-field">
            <label>Собственный порт прослушивания (пусто = SNI на 443)</label>
            <TextInput value={listenPort} onUpdate={setListenPort} placeholder="напр. 8443" size="l" type="number" />
          </div>
          <div className="dialog-field">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <label style={{ margin: 0 }}>Исходящий трафик</label>
              <Tooltip
                content={
                  <div style={{ maxWidth: 280 }}>
                    <b>VPN-подписка</b> — трафик идёт через VLESS/SOCKS5 прокси. Промо-контент от Telegram <b>не работает</b>.<br /><br />
                    <b>Тоннель</b> — трафик идёт через SSH/OpenVPN тоннель. Промо работает при правильно настроенном NAT IP.<br /><br />
                    Настройку тоннеля см. в инструкции.
                  </div>
                }
                placement="right"
              >
                <Icon data={CircleQuestion} size={16} style={{ cursor: 'help', color: 'var(--g-color-text-secondary)', flexShrink: 0 }} />
              </Tooltip>
            </div>
            <RadioButton
              value={outboundMode}
              onUpdate={(v) => setOutboundMode(v as 'vpn' | 'tunnel')}
              size="m"
              options={[
                { value: 'vpn', content: 'VPN-подписка' },
                { value: 'tunnel', content: 'Тоннель (SSH/VPN)' },
              ]}
            />
          </div>
          {outboundMode === 'vpn' && (
            <div className="dialog-field">
              <label>VLESS URL или socks5:// (необязательно)</label>
              <TextInput value={vpnSubscription} onUpdate={setVpnSubscription} placeholder="https://... или socks5://127.0.0.1:10808" size="l" />
            </div>
          )}
          {outboundMode === 'tunnel' && (
            <>
              <div className="dialog-field">
                <label>NAT IP — публичный IP тоннельного сервера</label>
                <TextInput value={natIp} onUpdate={setNatIp} placeholder="напр. 150.241.105.36" size="l" />
              </div>
              <div className="dialog-field">
                <label>Интерфейс тоннеля</label>
                <TextInput value={tunnelInterface} onUpdate={setTunnelInterface} placeholder="напр. tun0" size="l" />
              </div>
            </>
          )}
          <div className="dialog-field">
            <label>Self-steal хост — куда перенаправлять не-MTProto трафик (необязательно)</label>
            <TextInput value={maskHost} onUpdate={setMaskHost} placeholder="напр. 127.0.0.1:8080" size="l" />
          </div>
        </form>
      </Dialog.Body>
      <Dialog.Footer
        onClickButtonApply={handleSubmit as any}
        onClickButtonCancel={onClose}
        textButtonApply="Создать"
        textButtonCancel="Отмена"
        loading={loading}
      />
    </Dialog>
  );
}
