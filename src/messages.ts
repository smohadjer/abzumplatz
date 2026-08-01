export const getInactiveUserMessage = (adminName?: string) => {
  const adminLabel = adminName ? `Vereinsadministrator ${adminName}` : 'Vereinsadministrator';
  return `Ihr Konto wurde noch nicht aktiviert. Wenn Sie sich gerade registriert haben, warten Sie bitte, bis Ihr ${adminLabel} Ihr Konto freischaltet. Sollte Ihr Konto nach einiger Zeit noch nicht aktiviert sein, kontaktieren Sie bitte Ihren ${adminLabel}.`;
};
