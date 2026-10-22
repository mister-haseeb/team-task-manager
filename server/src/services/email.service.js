// Email sending is stubbed: messages are logged instead of sent over SMTP.
// Swap this function's body for a real provider (SendGrid, SES, ...) later.
async function sendTeamInvite({ to, teamName, inviterName, acceptUrl }) {
  console.log(
    `[email stub] To: ${to} | ${inviterName} invited you to join "${teamName}". ` +
      `Log in or register with this email to accept: ${acceptUrl}`
  );
}

module.exports = { sendTeamInvite };
