'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, saveSession } from '@/lib/api';
import { getRoleHome } from '@/lib/auth';
import { Button, Input, LanguageSwitcher } from '@/components/ui';
import { CevLogo, CEV_PORTAL_NAME } from '@/components/brand/cev-logo';
import { useI18n } from '@/components/providers/i18n-provider';
import { AuthLoading, useAuthRedirect } from '@/components/auth/auth-guard';
import { LoginPageFooter, CEV_WEBSITE_URL } from '@/components/layout/login-footer';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const ready = useAuthRedirect('login');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authApi.login(loginId, password);
      saveSession(res);
      router.replace(getRoleHome(res.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return <AuthLoading />;

  return (
    <div className="login-page">
      <header className="login-header">
        <span className="login-portal-name">{CEV_PORTAL_NAME}</span>
        <LanguageSwitcher />
      </header>

      <main className="login-main">
        <div className="login-content">
          <div className="login-logo">
            <a
              href={CEV_WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="login-logo-link inline-flex"
              aria-label="CEV Engineering Private Limited"
            >
              <CevLogo href={null} height={152} priority className="login-logo-image" />
            </a>
          </div>

          <div className="login-box">
            <p className="login-box-subtitle">{t('login.subtitle')}</p>

            <form onSubmit={handleSubmit} className="login-form">
              <Input
                label={t('login.loginId')}
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder={t('login.loginIdPlaceholder')}
              />
              <Input
                label={t('login.password')}
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="login-error">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? t('common.signingIn') : t('common.login')}
              </Button>
            </form>
          </div>
        </div>
      </main>

      <LoginPageFooter />
    </div>
  );
}
