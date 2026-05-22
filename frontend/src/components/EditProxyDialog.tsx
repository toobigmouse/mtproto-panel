import { useState, FormEvent, useEffect } from 'react';
import { Dialog, TextInput, Alert, Button, RadioButton, Tooltip, Icon } from '@gravity-ui/uikit';
import { CircleQuestion } from '@gravity-ui/icons';
import { updateProxy, ProxyData } from '../api';
import { copyToClipboard } from '../utils/clipboard';

interface Props {
  open: boolean;
  onClose: () => void;
  nodeId: number;
  proxy: ProxyData;
  onUpdated: () => void;
}

export default function EditProxyDialog({ open, onClose, nodeId, proxy, onUpdated }: Props) {
  const [name, setName] = useState(proxy.name || '');
  const [note, setNote] = useState(proxy.note || '');
  const [domain, setDomain] = useState(proxy.domain);
  const [tag, setTag] = useState(proxy.tag || '');
  const [maxConnections, setMaxConnections] = useState(proxy.maxConnections ? proxy.maxConnections.toString() : '');
  const [outboundMode, setOutboundMode] = useState<'vpn' | 'tunnel'>(proxy.natIp || proxy.tunnelInterface ? 'tunnel' : 'vpn');
  const [vpnSubscription, setVpnSubscription] = useState(proxy.vpnSubscription || '');
  const [natIp, setNatIp] = useState(proxy.natIp || '');
  const [tunnelInterface, setTunnelInterface] = useState(proxy.tunnelInterface || '');
  const [maskHost, setMaskHost] = useState(proxy.maskHost || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  // Re-initialize state when proxy prop changes (e.g. after save + reload)
  useEffect(() => {
    setName(proxy.name || '');
    setNote(proxy.note || '');
    setDomain(proxy.domain);
    setTag(proxy.tag || '');
    setMaxConnections(proxy.maxConnections ? proxy.maxConnections.toString() : '');
    setOutboundMode(proxy.natIp || proxy.tunnelInterface ? 'tunnel' : 'vpn');
    setVpnSubscription(proxy.vpnSubscription || '');
    setNatIp(proxy.natIp || '');
    setTunnelInterface(proxy.tunnelInterface || '');
    setMaskHost(proxy.maskHost || '');
  }, [proxy]);

  const handleCopySecret = async () => {
    await copyToClipboard(proxy.secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateProxy(nodeId, proxy.id, {
        name: name !== (proxy.name || '') ? name : undefined,
        note: note !== (proxy.note || '') ? note : undefined,
        domain: domain !== proxy.domain ? domain : undefined,
        tag: tag !== (proxy.tag || '') ? tag : undefined,
        maxConnections: parseInt(maxConnections, 10) || 0,
        vpnSubscription: outboundMode === 'vpn'
          ? (vpnSubscription !== (proxy.vpnSubscription || '') ? vpnSubscription : undefined)
          : '',
        natIp: outboundMode === 'tunnel'
          ? (natIp !== (proxy.natIp || '') ? natIp : undefined)
          : (proxy.natIp ? '' : undefined),
        tunnelInterface: outboundMode === 'tunnel'
          ? (tunnelInterface !== (proxy.tunnelInterface || '') ? tunnelInterface : undefined)
          : (proxy.tunnelInterface ? '' : undefined),
        maskHost: maskHost !== (proxy.maskHost || '') ? maskHost : undefined,
      });
      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} size="m">
      <Dialog.Header caption={`Редактировать ${proxy.name || 'прокси'}`} />
      <Dialog.Body>
        <form onSubmit={handleSubmit} id="edit-proxy-form">
          {error && (
            <div style={{ marginBottom: 16 }}>
              <Alert theme="danger" message={error} />
            </div>
          )}
          <div className="dialog-field">
            <label>Название</label>
            <TextInput value={name} onUpdate={setName} placeholder="Название прокси" size="l" />
          </div>
          <div className="dialog-field">
            <label>Заметка</label>
            <TextInput value={note} onUpdate={setNote} placeholder="Описание" size="l" />
          </div>
          <div className="dialog-field">
            <label>Секрет</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <TextInput value={proxy.secret} size="l" disabled style={{ flex: 1 }} />
              <Button view="outlined" size="l" onClick={handleCopySecret}>
                {secretCopied ? 'Скопировано' : 'Копировать'}
              </Button>
            </div>
          </div>
          <div className="dialog-field">
            <label>Fake TLS домен</label>
            <TextInput value={domain} onUpdate={setDomain} size="l" />
          </div>
          <div className="dialog-field">
            <label>Промо тег</label>
            <TextInput value={tag} onUpdate={setTag} placeholder="Опционально" size="l" />
          </div>
          <div className="dialog-field">
            <label>Лимит подключений (0 = без лимита)</label>
            <TextInput value={maxConnections} onUpdate={setMaxConnections} placeholder="0" size="l" type="number" />
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
              <label>VLESS URL или socks5:// (пусто = отключить)</label>
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
            <label>Self-steal — куда перенаправлять не-MTProto трафик (пусто = отключить)</label>
            <TextInput value={maskHost} onUpdate={setMaskHost} placeholder="напр. 127.0.0.1:8080" size="l" />
          </div>
        </form>
      </Dialog.Body>
      <Dialog.Footer
        onClickButtonApply={handleSubmit as any}
        onClickButtonCancel={onClose}
        textButtonApply="Сохранить"
        textButtonCancel="Отмена"
        loading={loading}
      />
    </Dialog>
  );
}
