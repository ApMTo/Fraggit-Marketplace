import { getSubnet } from './get-subnet.util';

describe('getSubnet', () => {
  it('returns /24 subnet for IPv4', () => {
    expect(getSubnet('192.168.1.42')).toBe('192.168.1.0/24');
  });

  it('handles IPv4-mapped IPv6 addresses', () => {
    expect(getSubnet('::ffff:10.0.0.5')).toBe('10.0.0.0/24');
  });

  it('returns /64 subnet for IPv6', () => {
    expect(getSubnet('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(
      '2001:0db8:85a3:0000::/64',
    );
  });

  it('returns original value for unknown format', () => {
    expect(getSubnet('invalid-ip')).toBe('invalid-ip');
  });
});
