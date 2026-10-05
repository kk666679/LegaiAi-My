export class BudgetNotifier {
  constructor({ config = {} } = {}) {
    this.config = {
      webhookUrl: config.webhookUrl,
      slackWebhook: config.slackWebhook,
      emailRecipients: config.emailRecipients ?? [],
    };
    this.notificationLog = [];
  }

  async notify({ type, scope, threshold, used, limit, severity }) {
    const notification = {
      ts: new Date().toISOString(),
      type,
      scope,
      threshold,
      used: parseFloat(used.toFixed(2)),
      limit: parseFloat(limit.toFixed(2)),
      severity,
      percentUsed: ((used / limit) * 100).toFixed(1),
    };

    this.notificationLog.push(notification);

    const message = this.formatMessage(notification);

    // Send to all configured channels
    const promises = [];

    if (this.config.webhookUrl) {
      promises.push(this.sendWebhook(notification));
    }

    if (this.config.slackWebhook) {
      promises.push(this.sendSlack(notification));
    }

    if (this.config.emailRecipients.length > 0) {
      promises.push(this.sendEmail(notification));
    }

    await Promise.allSettled(promises);

    return notification;
  }

  async sendWebhook(notification) {
    if (!this.config.webhookUrl) return;
    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });
      return response.ok;
    } catch (error) {
      console.error('Webhook notification failed:', error);
      return false;
    }
  }

  async sendSlack(notification) {
    if (!this.config.slackWebhook) return;
    try {
      const color = this.getColor(notification.severity);
      const response = await fetch(this.config.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [
            {
              color,
              title: `Budget Alert: ${notification.scope}`,
              text: this.formatMessage(notification),
              fields: [
                { title: 'Used', value: `$${notification.used}`, short: true },
                { title: 'Limit', value: `$${notification.limit}`, short: true },
                { title: 'Percent', value: `${notification.percentUsed}%`, short: true },
                { title: 'Severity', value: notification.severity.toUpperCase(), short: true },
              ],
              ts: Math.floor(new Date(notification.ts).getTime() / 1000),
            },
          ],
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('Slack notification failed:', error);
      return false;
    }
  }

  async sendEmail(notification) {
    // Email implementation would be here (using nodemailer or similar)
    console.log(`Email notification would be sent to: ${this.config.emailRecipients.join(', ')}`);
    return true;
  }

  formatMessage(notification) {
    return `Budget threshold reached: ${notification.scope} is at ${notification.percentUsed}% (${notification.used}/${notification.limit})`;
  }

  getColor(severity) {
    const colors = {
      info: '#36a64f',
      warning: '#ffa500',
      high: '#ff6600',
      critical: '#ff0000',
    };
    return colors[severity] ?? '#cccccc';
  }

  getLog({ limit = 100 } = {}) {
    return this.notificationLog.slice(-limit);
  }
}
