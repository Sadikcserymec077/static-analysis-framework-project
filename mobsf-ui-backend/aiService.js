const axios = require('axios');

const KNOWLEDGE_BASE = [
    {
        keywords: ['android:debuggable', 'debuggable', 'debugging'],
        title: 'App is Debuggable',
        risk: 'The application is configured to be debuggable. This allows anyone with physical access (or ADB) to attach a debugger, step through code, view variables, and potentially modify application behavior at runtime.',
        fix: `
\`\`\`xml
<!-- AndroidManifest.xml -->
<application
    android:debuggable="false"  <!-- Set this to false -->
    ... >
</application>
\`\`\`
**Recommendation**: Ensure \`android:debuggable\` is set to \`false\` in your release build type. In Gradle, this is usually handled automatically for release builds, but verify your \`build.gradle\`:
\`\`\`groovy
buildTypes {
    release {
        debuggable false
    }
}
\`\`\`
    `
    },
    {
        keywords: ['allowbackup', 'backup', 'android:allowBackup'],
        title: 'Insecure Backup Configuration',
        risk: 'The `android:allowBackup` flag is set to true. This allows users to backup application data via ADB. Attackers can use this to extract sensitive data from the app sandbox.',
        fix: `
\`\`\`xml
<!-- AndroidManifest.xml -->
<application
    android:allowBackup="false"  <!-- Disable backup -->
    ... >
</application>
\`\`\`
**Recommendation**: Explicitly set \`android:allowBackup="false"\` if your app does not require backup functionality. If you must allow backups, use \`android:fullBackupContent\` to exclude sensitive files.
    `
    },
    {
        keywords: ['hardcoded', 'api key', 'secret', 'password', 'token', 'aws', 'azure', 'google_api_key'],
        title: 'Hardcoded Secrets',
        risk: 'Sensitive information (API keys, passwords, tokens) is hardcoded in the source code. Reverse engineers can easily extract these strings and compromise your backend services.',
        fix: `
**Do not** store secrets in Java/Kotlin code or strings.xml.

**Best Practice**: Use \`local.properties\` (not committed to Git) and inject them at build time.

1. Add to \`local.properties\`:
\`\`\`properties
API_KEY=your_secret_key_here
\`\`\`

2. Read in \`build.gradle\`:
\`\`\`groovy
buildConfigField "String", "API_KEY", gradleLocalProperties(rootDir).getProperty("API_KEY")
\`\`\`

3. Access in code:
\`\`\`java
String key = BuildConfig.API_KEY;
\`\`\`
    `
    },
    {
        keywords: ['cleartext', 'http', 'usesCleartextTraffic', 'unencrypted', 'http://'],
        title: 'Cleartext Traffic Allowed',
        risk: 'The app allows cleartext HTTP traffic. This exposes network data to Man-in-the-Middle (MitM) attacks, allowing attackers to intercept or modify data in transit.',
        fix: `
\`\`\`xml
<!-- AndroidManifest.xml -->
<application
    android:usesCleartextTraffic="false"  <!-- Block HTTP -->
    ... >
</application>
\`\`\`
**Recommendation**: Enforce HTTPS. If you need to connect to a specific HTTP domain (e.g., for development), use a Network Security Config:
\`\`\`xml
<!-- res/xml/network_security_config.xml -->
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
\`\`\`
    `
    },
    {
        keywords: ['exported', 'activity', 'service', 'receiver', 'provider', 'android:exported'],
        title: 'Exported Component',
        risk: 'An Activity, Service, or Receiver is marked as `exported=true` without proper permission checks. Other malicious apps on the device can launch this component to perform unauthorized actions or steal data.',
        fix: `
\`\`\`xml
<!-- AndroidManifest.xml -->
<activity
    android:name=".MyActivity"
    android:exported="false" /> <!-- Set to false if not needed externally -->
\`\`\`
**Recommendation**: If the component is only for internal use, set \`exported="false"\`. If it must be external, protect it with a custom permission:
\`\`\`xml
<activity
    android:name=".MyActivity"
    android:exported="true"
    android:permission="com.example.myapp.MY_PERMISSION" />
\`\`\`
    `
    },
    {
        keywords: ['webview', 'javascript', 'setJavaScriptEnabled', 'addJavascriptInterface'],
        title: 'Insecure WebView Configuration',
        risk: 'Enabling JavaScript in a WebView can lead to Cross-Site Scripting (XSS) attacks if the WebView loads untrusted content. It may also allow access to local files.',
        fix: `
**Recommendation**: Only enable JavaScript if absolutely necessary and ensure you are loading content from a trusted source (HTTPS).

\`\`\`java
WebView myWebView = findViewById(R.id.webview);
WebSettings webSettings = myWebView.getSettings();
webSettings.setJavaScriptEnabled(false); // Disable if not needed
\`\`\`

If you must use JS, ensure you do not use \`addJavascriptInterface\` with untrusted content.
    `
    },
    {
        keywords: ['external storage', 'WRITE_EXTERNAL_STORAGE', 'READ_EXTERNAL_STORAGE', 'getExternalStorageDirectory'],
        title: 'Insecure External Storage Usage',
        risk: 'Using external storage allows other apps to read/write your files. It is also deprecated in newer Android versions (Scoped Storage).',
        fix: `
**Recommendation**: Use internal storage for sensitive data.
\`\`\`java
// Use this (Internal Storage)
File internalFile = new File(context.getFilesDir(), "secret.txt");
\`\`\`

If you need to share files, use \`FileProvider\`.
    `
    },
    {
        keywords: ['sql', 'injection', 'rawQuery', 'execSQL', 'sqlite'],
        title: 'Potential SQL Injection',
        risk: 'Using raw SQL queries with string concatenation allows attackers to manipulate queries and access unauthorized data.',
        fix: `
**Recommendation**: Use parameterized queries (Prepared Statements) or \`?\` placeholders.

**Bad**:
\`\`\`java
db.rawQuery("SELECT * FROM users WHERE name = '" + name + "'", null);
\`\`\`

**Good**:
\`\`\`java
db.rawQuery("SELECT * FROM users WHERE name = ?", new String[]{name});
\`\`\`
    `
    },
    {
        keywords: ['weak crypto', 'des', 'md5', 'sha1', 'rc4', 'blowfish'],
        title: 'Weak Cryptography',
        risk: 'The application uses weak or deprecated cryptographic algorithms (DES, MD5, SHA1, RC4). These can be easily broken by modern hardware.',
        fix: `
**Recommendation**: Use strong, modern algorithms.

- **Hashing**: Use SHA-256 or SHA-512 (or Argon2/Bcrypt for passwords).
- **Encryption**: Use AES-256-GCM.

**Example (AES-GCM)**:
\`\`\`java
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
\`\`\`
    `
    },
    {
        keywords: ['ssl', 'tls', 'certificate', 'trustmanager', 'hostnameverifier'],
        title: 'Insecure SSL/TLS Validation',
        risk: 'The application implements custom SSL validation that may accept self-signed certificates or ignore hostname verification. This enables Man-in-the-Middle attacks.',
        fix: `
**Recommendation**: Do not implement custom \`TrustManager\` or \`HostnameVerifier\` that blindly accepts all certificates.

Use Android's Network Security Configuration to handle custom CAs if needed:
\`\`\`xml
<network-security-config>
    <base-config>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="@raw/my_custom_ca" />
        </trust-anchors>
    </base-config>
</network-security-config>
\`\`\`
    `
    },
    {
        keywords: ['firebase', 'database', 'rules', 'firestore'],
        title: 'Insecure Firebase Rules',
        risk: 'Firebase database rules may be set to public read/write, allowing anyone to access or modify your data.',
        fix: `
**Recommendation**: Configure Firebase Security Rules to restrict access.

**Bad**:
\`\`\`json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
\`\`\`

**Good**:
\`\`\`json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
\`\`\`
    `
    },
    {
        keywords: ['clipboard', 'copy', 'paste', 'sensitive'],
        title: 'Sensitive Data in Clipboard',
        risk: 'Copying sensitive data (like passwords or OTPs) to the clipboard allows other apps to read it.',
        fix: `
**Recommendation**: Clear the clipboard after a short timeout or prevent copying of sensitive fields.

\`\`\`java
// Clear clipboard
ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
clipboard.setPrimaryClip(ClipData.newPlainText("", ""));
\`\`\`
    `
    }
];

const DEFAULT_RESPONSE = {
    title: 'General Security Finding',
    risk: 'This finding indicates a potential security weakness. Our local expert system could not match this specific finding to a detailed remediation guide.',
    fix: `
**General Recommendation**:
1. **Analyze the Code**: Look at the specific line of code highlighted in the report.
2. **Context Matters**: Determine if the data being handled is sensitive.
3. **Consult Docs**: Check the official Android Security documentation for the API being used.
4. **False Positive?**: Static analysis tools can sometimes report false positives. Verify if this is actually a vulnerability in your specific context.
  `
};

/**
 * Analyzes a finding and returns a remediation advice.
 * Uses external AI if API key is present, otherwise falls back to local knowledge base.
 * @param {string} query - The title or description of the vulnerability.
 * @returns {Promise<object>} { title, risk, fix }
 */
async function explain(query) {
    if (!query) return DEFAULT_RESPONSE;

    // 1. Try External AI (if configured)
    const apiKey = process.env.AI_API_KEY;
    console.log("AI Service: Checking for API Key...", apiKey ? "Found" : "Not Found");

    if (apiKey) {
        try {
            console.log("AI Service: Calling Google Gemini API for query:", query);
            // Google Gemini API Endpoint
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

            const response = await axios.post(url, {
                contents: [{
                    parts: [{
                        text: `You are a mobile security expert. Provide a concise risk assessment and a code fix for the following Android vulnerability: ${query}`
                    }]
                }]
            });

            console.log("AI Service: API Response received");
            const content = response.data.candidates[0].content.parts[0].text;
            return {
                title: 'AI Analysis (Gemini)',
                risk: 'AI-generated risk assessment via Gemini.',
                fix: content
            };
        } catch (err) {
            console.error("AI API call failed:", err.message);
            if (err.response) {
                console.error("AI API Error Data:", err.response.data);
            }
        }
    }

    // 2. Fallback to Local Knowledge Base
    const lowerQuery = query.toLowerCase();
    let bestMatch = null;
    let maxScore = 0;

    KNOWLEDGE_BASE.forEach(item => {
        let score = 0;
        item.keywords.forEach(k => {
            if (lowerQuery.includes(k.toLowerCase())) {
                score++;
            }
        });

        if (score > maxScore) {
            maxScore = score;
            bestMatch = item;
        }
    });

    if (bestMatch && maxScore > 0) {
        return bestMatch;
    }

    return DEFAULT_RESPONSE;
}

module.exports = { explain };
