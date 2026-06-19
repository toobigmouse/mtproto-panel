import { useState, useEffect } from 'react';
import { Card, TextInput, Label, Button, Alert } from '@gravity-ui/uikit';
import { getMe, getPanelVersion, updatePanel } from '../../api';
import s from './Settings.module.scss';

export default function Settings() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [panelVersion, setPanelVersion] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    getMe()
      .then((data) => setUsername(data.user.username))
      .catch(() => {})
      .finally(() => setLoading(false));

    getPanelVersion()
      .then((data) => setPanelVersion(data.version))
      .catch(() => {});
  }, []);

  const handleUpdate = async () => {
    if (!confirm('Запустить обновление панели? Панель перезапустится.')) return;
    setUpdating(true);
    setUpdateMessage('');
    setUpdateError('');
    try {
      const result = await updatePanel();
      setUpdateMessage(result.message);
    } catch (err: any) {
      setUpdateError(err.message || 'Ошибка запуска обновления');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <h2 className={s.title}>Настройки</h2>

      <Card view="outlined" className={s.card}>
        <h3>Аккаунт</h3>
        <div className={s.field}>
          <label>Имя пользователя</label>
          <TextInput value={username} size="l" disabled />
        </div>
        <div className={s.hint}>
          <Label theme="info" size="xs">
            Для смены пароля обновите переменную ADMIN_PASSWORD и перезапустите бэкенд.
          </Label>
        </div>
      </Card>

      <Card view="outlined" className={s.card} style={{ marginTop: 16 }}>
        <h3>Панель</h3>
        <div className={s.field}>
          <label>Версия</label>
          <TextInput value={panelVersion ? `v${panelVersion}` : '—'} size="l" disabled />
        </div>
        {updateMessage && (
          <div style={{ marginBottom: 12 }}>
            <Alert theme="success" message={updateMessage} />
          </div>
        )}
        {updateError && (
          <div style={{ marginBottom: 12 }}>
            <Alert theme="danger" message={updateError} />
          </div>
        )}
        <Button view="action" size="l" loading={updating} onClick={handleUpdate}>
          Обновить панель
        </Button>
      </Card>
    </>
  );
}
