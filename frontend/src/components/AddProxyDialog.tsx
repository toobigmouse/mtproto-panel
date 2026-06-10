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
  const [advancedOptions, setAdvancedOptions] = useState({
    useMiddleProxy: true,
    fastMode: true,
    me2dcFallback: true,
    me2dcFast: true,
    meKeepaliveEnabled: true,
    meKeepaliveIntervalSecs: 5,
    meKeepaliveJitterSecs: 1,
    meKeepalivePayloadRandom: true,
    meReconnectBackoffBaseMs: 200,
    meReconnectBackoffCapMs: 1000,
    meReconnectFastRetryCount: 12,
    desyncAllFull: true,
    meWriterPickMode: 'fast',
    meWarmupStaggerEnabled: true,
    meWarmupStepDelayMs: 30,
    meWarmupStepJitterMs: 5,
    beobachten: true,
    beobachtenMinutes: 15,
    beobachtenFlushSecs: 5,
    beobachtenFile: '/tmp/telemt-beobachten.json',
    upstreamConnectRetryAttempts: 5,
    upstreamConnectRetryBackoffMs: 500,
    tgConnect: true,
    rstOnClose: true,
    logLevel: 'info',
    unknownDcFileLogEnabled: true,
    updateEvery: 30,
    networkPrefer: 'system',
    stunServers: 'stun.l.google.com:19302',
    serverClientMss: 1360,
    censorshipTlsDomain: '',
    censorshipTlsEmulation: 'tls',
    censorshipTlsFrontDir: '',
    meInitRetryAttempts: 5,
  });
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
        useMiddleProxy: advancedOptions.useMiddleProxy,
        fastMode: advancedOptions.fastMode,
        me2dcFallback: advancedOptions.me2dcFallback,
        me2dcFast: advancedOptions.me2dcFast,
        meKeepaliveEnabled: advancedOptions.meKeepaliveEnabled,
        meKeepaliveIntervalSecs: advancedOptions.meKeepaliveIntervalSecs,
        meKeepaliveJitterSecs: advancedOptions.meKeepaliveJitterSecs,
        meKeepalivePayloadRandom: advancedOptions.meKeepalivePayloadRandom,
        meReconnectBackoffBaseMs: advancedOptions.meReconnectBackoffBaseMs,
        meReconnectBackoffCapMs: advancedOptions.meReconnectBackoffCapMs,
        meReconnectFastRetryCount: advancedOptions.meReconnectFastRetryCount,
        desyncAllFull: advancedOptions.desyncAllFull,
        meWriterPickMode: advancedOptions.meWriterPickMode,
        meWarmupStaggerEnabled: advancedOptions.meWarmupStaggerEnabled,
        meWarmupStepDelayMs: advancedOptions.meWarmupStepDelayMs,
        meWarmupStepJitterMs: advancedOptions.meWarmupStepJitterMs,
        beobachten: advancedOptions.beobachten,
        beobachtenMinutes: advancedOptions.beobachtenMinutes,
        beobachtenFlushSecs: advancedOptions.beobachtenFlushSecs,
        beobachtenFile: advancedOptions.beobachtenFile,
        upstreamConnectRetryAttempts: advancedOptions.upstreamConnectRetryAttempts,
        upstreamConnectRetryBackoffMs: advancedOptions.upstreamConnectRetryBackoffMs,
        tgConnect: advancedOptions.tgConnect,
        rstOnClose: advancedOptions.rstOnClose,
        logLevel: advancedOptions.logLevel,
        unknownDcFileLogEnabled: advancedOptions.unknownDcFileLogEnabled,
        updateEvery: advancedOptions.updateEvery,
        networkPrefer: advancedOptions.networkPrefer,
        stunServers: advancedOptions.stunServers
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        serverClientMss: advancedOptions.serverClientMss,
        censorshipTlsDomain: advancedOptions.censorshipTlsDomain || undefined,
        censorshipTlsEmulation: advancedOptions.censorshipTlsEmulation,
        censorshipTlsFrontDir: advancedOptions.censorshipTlsFrontDir || undefined,
        meInitRetryAttempts: advancedOptions.meInitRetryAttempts,
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
      setAdvancedOptions({
        useMiddleProxy: true,
        fastMode: true,
        me2dcFallback: true,
        me2dcFast: true,
        meKeepaliveEnabled: true,
        meKeepaliveIntervalSecs: 5,
        meKeepaliveJitterSecs: 1,
        meKeepalivePayloadRandom: true,
        meReconnectBackoffBaseMs: 200,
        meReconnectBackoffCapMs: 1000,
        meReconnectFastRetryCount: 12,
        desyncAllFull: true,
        meWriterPickMode: 'fast',
        meWarmupStaggerEnabled: true,
        meWarmupStepDelayMs: 30,
        meWarmupStepJitterMs: 5,
        beobachten: true,
        beobachtenMinutes: 15,
        beobachtenFlushSecs: 5,
        beobachtenFile: '/tmp/telemt-beobachten.json',
        upstreamConnectRetryAttempts: 5,
        upstreamConnectRetryBackoffMs: 500,
        tgConnect: true,
        rstOnClose: true,
        logLevel: 'info',
        unknownDcFileLogEnabled: true,
        updateEvery: 30,
        networkPrefer: 'system',
        stunServers: 'stun.l.google.com:19302',
        serverClientMss: 1360,
        censorshipTlsDomain: '',
        censorshipTlsEmulation: 'tls',
        censorshipTlsFrontDir: '',
        meInitRetryAttempts: 5,
      });
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
                <span style={{ cursor: 'help', color: 'var(--g-color-text-secondary)', flexShrink: 0, display: 'inline-flex' }}><Icon data={CircleQuestion} size={16} /></span>
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
          <div className="dialog-field">
            <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Дополнительные настройки telemt</label>
            <div style={{ display: 'grid', gap: 12 }}>
              <Select
                value={[advancedOptions.useMiddleProxy ? 'true' : 'false']}
                onUpdate={(val) => setAdvancedOptions((prev) => ({ ...prev, useMiddleProxy: val[0] === 'true' }))}
                options={[
                  { value: 'true', content: 'use_middle_proxy = true' },
                  { value: 'false', content: 'use_middle_proxy = false' },
                ]}
                width="max"
              />
              <Select
                value={[advancedOptions.fastMode ? 'true' : 'false']}
                onUpdate={(val) => setAdvancedOptions((prev) => ({ ...prev, fastMode: val[0] === 'true' }))}
                options={[
                  { value: 'true', content: 'fast_mode = true' },
                  { value: 'false', content: 'fast_mode = false' },
                ]}
                width="max"
              />
              <div style={{ display: 'grid', gap: 8 }}>
                <label>stun_servers (comma-separated)</label>
                <TextInput
                  value={advancedOptions.stunServers}
                  onUpdate={(val) => setAdvancedOptions((prev) => ({ ...prev, stunServers: val }))}
                  placeholder="stun.l.google.com:19302, stun1.l.google.com:19302"
                  size="l"
                />
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <label>censorship_tls_domain (необязательно)</label>
                <TextInput
                  value={advancedOptions.censorshipTlsDomain}
                  onUpdate={(val) => setAdvancedOptions((prev) => ({ ...prev, censorshipTlsDomain: val }))}
                  placeholder="Example: www.google.com"
                  size="l"
                />
              </div>
              <Select
                value={[advancedOptions.censorshipTlsEmulation]}
                onUpdate={(val) => setAdvancedOptions((prev) => ({ ...prev, censorshipTlsEmulation: val[0] || 'tls' }))}
                options={[
                  { value: 'tls', content: 'tls' },
                  { value: 'http', content: 'http' },
                  { value: 'none', content: 'none' },
                ]}
                width="max"
              />
              <div style={{ display: 'grid', gap: 8 }}>
                <label>censorship_tls_front_dir</label>
                <TextInput
                  value={advancedOptions.censorshipTlsFrontDir}
                  onUpdate={(val) => setAdvancedOptions((prev) => ({ ...prev, censorshipTlsFrontDir: val }))}
                  placeholder="tls"
                  size="l"
                />
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <label>me_init_retry_attempts</label>
                <TextInput
                  type="number"
                  value={advancedOptions.meInitRetryAttempts.toString()}
                  onUpdate={(val) => setAdvancedOptions((prev) => ({ ...prev, meInitRetryAttempts: parseInt(val, 10) || 0 }))}
                  size="l"
                />
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <label>log_level</label>
                <Select
                  value={[advancedOptions.logLevel]}
                  onUpdate={(val) => setAdvancedOptions((prev) => ({ ...prev, logLevel: val[0] || 'info' }))}
                  options={['debug', 'info', 'warn', 'error'].map((level) => ({ value: level, content: level }))}
                  width="max"
                />
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <label>network_prefer</label>
                <Select
                  value={[advancedOptions.networkPrefer]}
                  onUpdate={(val) => setAdvancedOptions((prev) => ({ ...prev, networkPrefer: val[0] || 'system' }))}
                  options={['system', 'ipv4', 'ipv6'].map((value) => ({ value, content: value }))}
                  width="max"
                />
              </div>
            </div>
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
