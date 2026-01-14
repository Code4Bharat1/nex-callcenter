import React from 'react';

export const part1Step1Only = [
  {
    selector: '.tour-nav-playground .menu__btn',
    content: (
      <div style={{ padding: '20px', background: '#f0f0ff' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
          Test Tour Step 1
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>
          If you can see this pink box, the tour system is working!
        </p>
      </div>
    ),
  },
];

export const part1Step2Only = [
  {
    selector: '.tour-nav-testcall .menu__btn',
    content: (
      <div style={{ padding: '20px', background: '#f0f0ff' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
          Test Tour Step 2
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>
          If you can see this pink box, the tour system is working!
        </p>
      </div>
    ),
  },
];

export const tourStyles = {
  popover: (base) => ({
    ...base,
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    padding: '24px',
    maxWidth: '320px',
    zIndex: 10001,
  }),
  maskArea: (base) => ({
    ...base,
    rx: '12px',
  }),
  maskWrapper: (base) => ({
    ...base,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 10000,
  }),
  dot: (base) => ({
    ...base,
    backgroundColor: '#4B5CFF',
  }),
};

export const tourLocale = {
  lastStepLastMessage: '🎉 Done!',
};
