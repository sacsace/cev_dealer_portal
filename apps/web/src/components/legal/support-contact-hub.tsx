'use client';

import { useState } from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui';
import { supportContactInfo, type SupportDepartment } from '@/lib/legal-content';
import { useI18n } from '@/components/providers/i18n-provider';

const MESSAGE_MAX = 180;

const departmentLabelKeys: Record<SupportDepartment['id'], 'legal.departmentSales' | 'legal.departmentService' | 'legal.departmentWarranty'> = {
  sales: 'legal.departmentSales',
  service: 'legal.departmentService',
  warranty: 'legal.departmentWarranty',
};

function phoneHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.startsWith('1800') ? `tel:${digits}` : `tel:${digits.replace(/^\+/, '')}`;
}

export function SupportContactHub() {
  const { t } = useI18n();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const subject = encodeURIComponent(`CEV Dealer Portal inquiry from ${firstName.trim() || 'Customer'}`);
    const body = encodeURIComponent(
      [
        `Name: ${firstName.trim()}`,
        `Email: ${email.trim()}`,
        phone.trim() ? `Phone: ${phone.trim()}` : null,
        '',
        message.trim(),
      ]
        .filter(Boolean)
        .join('\n'),
    );

    window.location.href = `mailto:${supportContactInfo.customerEmail}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="legal-support-hub">
      <div className="legal-support-hub-info">
        <p className="legal-support-hub-eyebrow">{t('legal.contactLabel')}</p>
        <h2 className="legal-support-hub-title">{t('legal.companyName')}</h2>

        <div className="legal-support-hub-block">
          <h3 className="legal-support-hub-block-title">{t('legal.businessHours')}</h3>
          <ul className="legal-support-hub-hours">
            <li>
              <Clock className="h-4 w-4 shrink-0 text-[var(--cev-blue)]" strokeWidth={1.75} />
              <span>{t('legal.hoursWeekday')}</span>
            </li>
            <li>
              <Clock className="h-4 w-4 shrink-0 text-[var(--cev-blue)]" strokeWidth={1.75} />
              <span>{t('legal.hoursSaturday')}</span>
            </li>
          </ul>
        </div>

        <div className="legal-support-hub-block">
          <h3 className="legal-support-hub-block-title">{t('legal.corporateOffice')}</h3>
          <ul className="legal-support-contact-list">
            <li>
              <MapPin className="h-4 w-4 shrink-0 text-[var(--cev-blue)]" strokeWidth={1.75} />
              <span>{supportContactInfo.address}</span>
            </li>
            <li>
              <Mail className="h-4 w-4 shrink-0 text-[var(--cev-blue)]" strokeWidth={1.75} />
              <a href={`mailto:${supportContactInfo.customerEmail}`} className="legal-inline-link">
                {supportContactInfo.customerEmail}
              </a>
            </li>
          </ul>
        </div>

        <div className="legal-support-hub-departments">
          {supportContactInfo.departments.map((dept) => (
            <div key={dept.id} className="legal-support-hub-dept">
              <h3 className="legal-support-hub-dept-title">{t(departmentLabelKeys[dept.id])}</h3>
              <ul className="legal-support-hub-dept-list">
                <li>
                  <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--cev-blue)]" strokeWidth={1.75} />
                  <a href={`mailto:${dept.email}`} className="legal-inline-link">
                    {dept.email}
                  </a>
                </li>
                {dept.phones.map((item) => (
                  <li key={item}>
                    <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--cev-blue)]" strokeWidth={1.75} />
                    <a href={phoneHref(item)} className="legal-inline-link">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="legal-support-hub-map">
          <iframe
            title={t('legal.mapTitle')}
            src={supportContactInfo.mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>

      <div className="legal-support-hub-form-wrap">
        <p className="legal-support-hub-eyebrow">{t('legal.writeToUs')}</p>
        <h2 className="legal-support-hub-title">{t('legal.leaveQuery')}</h2>

        <form className="legal-support-hub-form" onSubmit={handleSubmit}>
          <Input
            label={t('legal.firstName')}
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t('legal.firstNamePlaceholder')}
          />
          <Input
            label={t('legal.emailAddress')}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('legal.emailPlaceholder')}
          />
          <Input
            label={t('legal.phoneNumber')}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('legal.phonePlaceholder')}
          />
          <div>
            <Textarea
              label={t('legal.message')}
              value={message}
              maxLength={MESSAGE_MAX}
              rows={5}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('legal.messagePlaceholder')}
            />
            <p className="legal-support-hub-char-count">
              {message.length} / {MESSAGE_MAX}
            </p>
          </div>
          <Button type="submit" className="legal-support-hub-submit w-full">
            {t('legal.sendMessage')}
          </Button>
        </form>
      </div>
    </div>
  );
}
