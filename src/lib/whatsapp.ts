export const NOTIFICATION_TEMPLATES = {
  DAILY_ACTIVITY_SUBMITTED: (projectName: string, activityName: string) =>
    `SocialForest: Daily activity "${activityName}" submitted for project ${projectName}.`,
  BILL_GENERATED: (billNumber: string, amount: string) =>
    `SocialForest: Bill ${billNumber} generated for ₹${amount}. Please review.`,
  PAYMENT_RECEIVED: (amount: string, projectName: string) =>
    `SocialForest: Payment of ₹${amount} received for project ${projectName}.`,
  INVOICE_SUBMITTED: (invoiceNumber: string) =>
    `SocialForest: Invoice ${invoiceNumber} submitted for approval.`,
  TREE_CENSUS_UPDATE: (projectName: string, healthyCount: number) =>
    `SocialForest: Tree census updated for ${projectName}. ${healthyCount} trees healthy.`,
  ESG_REPORT_READY: (projectName: string, period: string) =>
    `SocialForest: ESG report for ${projectName} (${period}) is ready for review.`,
};
