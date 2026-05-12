# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported |
| ------- | --------- |
| 0.0.x   | Yes       |

## Reporting a Vulnerability

We take the security of imgtowebp seriously. If you discover a security vulnerability, please follow these steps:

### 1. **Do Not** Open a Public Issue

Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.

### 2. Report Privately

Send a detailed report to the maintainer via:
- GitHub Security Advisories (preferred): Use the "Report a vulnerability" button in the Security tab
- Email: [Contact the repository owner through their GitHub profile]

### 3. Include Details

Please include as much information as possible:
- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability
- Potential fixes (if you have suggestions)

### 4. Response Timeline

- **Initial Response**: Within 48 hours, we'll acknowledge receipt of your report
- **Status Update**: Within 7 days, we'll provide a detailed response with next steps
- **Fix Timeline**: We aim to release a fix within 30 days for critical vulnerabilities

### 5. Disclosure Policy

- We request that you give us reasonable time to address the vulnerability before public disclosure
- We will credit you in the security advisory (unless you prefer to remain anonymous)
- Once a fix is released, we will publish a security advisory

## Security Best Practices for Users

When using imgtowebp:

### Input Validation

- Always validate and sanitize user-uploaded images
- Implement file size limits to prevent resource exhaustion
- Verify file types before processing

### Resource Management

- Set appropriate `maxWidth` and `maxHeight` limits
- Use `targetBytes` to control output size
- Monitor memory usage when processing large images

### Node.js Environment

- Keep dependencies up to date, especially `sharp`
- Run with appropriate user permissions (avoid root)
- Implement rate limiting for image processing endpoints

### Browser Environment

- Validate image sources to prevent XSS attacks
- Use Content Security Policy (CSP) headers
- Sanitize file names before using them

### Example: Safe Usage

```typescript
// Node.js example with safety checks
import { imageToWebp } from "imgtowebp/node";

async function safeImageConversion(input: Buffer) {
  // Validate input size
  if (input.length > 10 * 1024 * 1024) { // 10MB limit
    throw new Error("Image too large");
  }

  try {
    const result = await imageToWebp(input, {
      maxWidth: 2048,
      maxHeight: 2048,
      targetBytes: 500_000,
      maxQuality: 0.85,
      minQuality: 0.50,
    });
    
    return result;
  } catch (error) {
    // Handle errors appropriately
    console.error("Image conversion failed:", error);
    throw error;
  }
}
```

## Known Security Considerations

### Dependencies

This package depends on `sharp` for Node.js image processing. Sharp uses native libraries (libvips) which are regularly updated for security. Keep your dependencies current:

```bash
npm update sharp
```

### Browser Canvas API

The browser implementation uses Canvas/OffscreenCanvas APIs. Be aware:
- Canvas operations can be resource-intensive
- Large images may cause browser performance issues
- Consider implementing client-side size limits

## Security Updates

Security updates will be released as patch versions and announced via:
- GitHub Security Advisories
- Release notes
- npm package updates

Subscribe to repository notifications to stay informed about security updates.

## Scope

This security policy applies to:
- The imgtowebp package code
- Official documentation and examples
- Build and distribution processes

It does not cover:
- Third-party dependencies (report to their respective maintainers)
- User implementations and integrations
- Forked or modified versions

## Contact

For security concerns that don't constitute a vulnerability, you can:
- Open a regular GitHub issue
- Start a discussion in GitHub Discussions

Thank you for helping keep imgtowebp and its users safe!
