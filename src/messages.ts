export const getInactiveUserMessage = (adminName?: string) => {
  const adminLabel = adminName ? `Vereinsadministrator ${adminName}` : 'Vereinsadministrator';
  return `Ihr Konto ist derzeit inaktiv. Bitte kontaktieren Sie Ihren ${adminLabel}.`;
};
