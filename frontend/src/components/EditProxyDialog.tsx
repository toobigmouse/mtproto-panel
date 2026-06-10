import { useState, FormEvent, useEffect } from 'react';
import { Dialog, TextInput, Alert, Button, RadioButton, Select, Tooltip, Icon } from '@gravity-ui/uikit';
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
  const [listenPort, setListenPort] = useState(proxy.listenPort ? proxy.listenPort.toString() : '');
  const [outboundMode, setOutboundMode] = useState<'vpn' | 'tunnel'>(proxy.natIp || proxy.tunnelInterface ? 'tunnel' : 'vpn');
  const [vpnSubscription, setVpnSubscription] = useState(proxy.vpnSubscription || '');
  const [natIp, setNatIp] = useState(proxy.natIp || '');
  const [tunnelInterface, setTunnelInterface] = useState(proxy.tunnelInterface || '');
  const [maskHost, setMaskHost] = useState(proxy.maskHost || '');
  const [advancedOptions, setAdvancedOptions] = useState({
    useMiddleProxy: proxy.useMiddleProxy ?? true,
    fastMode: proxy.fastMode ?? true,
    me2dcFallback: proxy.me2dcFallback ?? true,
    me2dcFast: proxy.me2dcFast ?? true,
    meKeepaliveEnabled: proxy.meKeepaliveEnabled ?? true,
    meKeepaliveIntervalSecs: proxy.meKeepaliveIntervalSecs ?? 5,
    meKeepaliveJitterSecs: proxy.meKeepaliveJitterSecs ?? 1,
    meKeepalivePayloadRandom: proxy.meKeepalivePayloadRandom ?? true,
    meReconnectBackoffBaseMs: proxy.meReconnectBackoffBaseMs ?? 200,
    meReconnectBackoffCapMs: proxy.meReconnectBackoffCapMs ?? 1000,
    meReconnectFastRetryCount: proxy.meReconnectFastRetryCount ?? 12,
    desyncAllFull: proxy.desyncAllFull ?? true,
    meWriterPickMode: proxy.meWriterPickMode || 'fast',
    meWarmupStaggerEnabled: proxy.meWarmupStaggerEnabled ?? true,
    meWarmupStepDelayMs: proxy.meWarmupStepDelayMs ?? 30,
    meWarmupStepJitterMs: proxy.meWarmupStepJitterMs ?? 5,
    beobachten: proxy.beobachten ?? true,
    beobachtenMinutes: proxy.beobachtenMinutes ?? 15,
    beobachtenFlushSecs: proxy.beobachtenFlushSecs ?? 5,
    beobachtenFile: proxy.beobachtenFile || '/tmp/telemt-beobachten.json',
    upstreamConnectRetryAttempts: proxy.upstreamConnectRetryAttempts ?? 5,
    upstreamConnectRetryBackoffMs: proxy.upstreamConnectRetryBackoffMs ?? 500,
    tgConnect: proxy.tgConnect ?? true,
    rstOnClose: proxy.rstOnClose ?? true,
    logLevel: proxy.logLevel || 'info',
    unknownDcFileLogEnabled: proxy.unknownDcFileLogEnabled ?? true,
    updateEvery: proxy.updateEvery ?? 30,
    networkPrefer: proxy.networkPrefer || 'system',
    stunServers: proxy.stunServers ? proxy.stunServers.join(', ') : 'stun.l.google.com:19302',
    serverClientMss: proxy.serverClientMss ?? 1360,
    censorshipTlsDomain: proxy.censorshipTlsDomain || '',
    censorshipTlsEmulation: proxy.censorshipTlsEmulation || 'tls',
    censorshipTlsFrontDir: proxy.censorshipTlsFrontDir || '',
    meInitRetryAttempts: proxy.meInitRetryAttempts ?? 5,
  });
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
    setAdvancedOptions({
      useMiddleProxy: proxy.useMiddleProxy ?? true,
      fastMode: proxy.fastMode ?? true,
      me2dcFallback: proxy.me2dcFallback ?? true,
      me2dcFast: proxy.me2dcFast ?? true,
      meKeepaliveEnabled: proxy.meKeepaliveEnabled ?? true,
      meKeepaliveIntervalSecs: proxy.meKeepaliveIntervalSecs ?? 5,
      meKeepaliveJitterSecs: proxy.meKeepaliveJitterSecs ?? 1,
      meKeepalivePayloadRandom: proxy.meKeepalivePayloadRandom ?? true,
      meReconnectBackoffBaseMs: proxy.meReconnectBackoffBaseMs ?? 200,
      meReconnectBackoffCapMs: proxy.meReconnectBackoffCapMs ?? 1000,
      meReconnectFastRetryCount: proxy.meReconnectFastRetryCount ?? 12,
      desyncAllFull: proxy.desyncAllFull ?? true,
      meWriterPickMode: proxy.meWriterPickMode || 'fast',
      meWarmupStaggerEnabled: proxy.meWarmupStaggerEnabled ?? true,
      meWarmupStepDelayMs: proxy.meWarmupStepDelayMs ?? 30,
      meWarmupStepJitterMs: proxy.meWarmupStepJitterMs ?? 5,
      beobachten: proxy.beobachten ?? true,
      beobachtenMinutes: proxy.beobachtenMinutes ?? 15,
      beobachtenFlushSecs: proxy.beobachtenFlushSecs ?? 5,
      beobachtenFile: proxy.beobachtenFile || '/tmp/telemt-beobachten.json',
      upstreamConnectRetryAttempts: proxy.upstreamConnectRetryAttempts ?? 5,
      upstreamConnectRetryBackoffMs: proxy.upstreamConnectRetryBackoffMs ?? 500,
      tgConnect: proxy.tgConnect ?? true,
      rstOnClose: proxy.rstOnClose ?? true,
      logLevel: proxy.logLevel || 'info',
      unknownDcFileLogEnabled: proxy.unknownDcFileLogEnabled ?? true,
      updateEvery: proxy.updateEvery ?? 30,
      networkPrefer: proxy.networkPrefer || 'system',
      stunServers: proxy.stunServers ? proxy.stunServers.join(', ') : 'stun.l.google.com:19302',
      serverClientMss: proxy.serverClientMss ?? 1360,
      censorshipTlsDomain: proxy.censorshipTlsDomain || '',
      censorshipTlsEmulation: proxy.censorshipTlsEmulation || 'tls',
      censorshipTlsFrontDir: proxy.censorshipTlsFrontDir || '',
      meInitRetryAttempts: proxy.meInitRetryAttempts ?? 5,
    });
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
        listenPort: listenPort ? parseInt(listenPort, 10) : undefined,
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
          <div className="dialog-field">
            <label>Собственный порт прослушивания</label>
            <TextInput value={listenPort} onUpdate={setListenPort} placeholder="напр. 8443" size="l" type="number" />
          </div>
          <div className="dialog-field">
            <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Дополнительные настройки telemt</label>
            <div style={{ display: 'grid', gap: 12 }}>
              <Select
                value={[advancedOptions.useMiddleProxy ? 'true' : 'false']}
                onUpdate={(val: string[]) => setAdvancedOptions((prev) => ({ ...prev, useMiddleProxy: val[0] === 'true' }))}
                options={[
                  { value: 'true', content: 'use_middle_proxy = true' },
                  { value: 'false', content: 'use_middle_proxy = false' },
                ]}
                width="max"
              />
              <Select
                value={[advancedOptions.fastMode ? 'true' : 'false']}
                onUpdate={(val: string[]) => setAdvancedOptions((prev) => ({ ...prev, fastMode: val[0] === 'true' }))}
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
                <label>censorship_tls_domain</label>
                <TextInput
                  value={advancedOptions.censorshipTlsDomain}
                  onUpdate={(val) => setAdvancedOptions((prev) => ({ ...prev, censorshipTlsDomain: val }))}
                  placeholder="напр. www.google.com"
                  size="l"
                />
              </div>
              <Select
                value={[advancedOptions.censorshipTlsEmulation]}
                onUpdate={(val: string[]) => setAdvancedOptions((prev) => ({ ...prev, censorshipTlsEmulation: val[0] || 'tls' }))}
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
                  onUpdate={(val: string[]) => setAdvancedOptions((prev) => ({ ...prev, logLevel: val[0] || 'info' }))}
                  options={['debug', 'info', 'warn', 'error'].map((level) => ({ value: level, content: level }))}
                  width="max"
                />
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <label>network_prefer</label>
                <Select
                  value={[advancedOptions.networkPrefer]}
                  onUpdate={(val: string[]) => setAdvancedOptions((prev) => ({ ...prev, networkPrefer: val[0] || 'system' }))}
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
        textButtonApply="Сохранить"
        textButtonCancel="Отмена"
        loading={loading}
      />
    </Dialog>
  );
}
