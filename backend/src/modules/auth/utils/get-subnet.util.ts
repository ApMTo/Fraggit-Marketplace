export function getSubnet(ip: string): string {
  const cleanIp = ip.replace(/^::ffff:/, '');

  if (cleanIp.includes('.')) {
    const parts = cleanIp.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
  }

  if (cleanIp.includes(':')) {
    const parts = cleanIp.split(':');
    const subnet = parts.slice(0, 4).join(':');
    return `${subnet}::/64`;
  }

  return cleanIp;
}
