import Head from 'next/head';
import { useState } from 'react';

interface ApiResponse {
    message?: string;
    user?: any;
    session?: any;
    error?: string;
    success?: boolean;
}

export default function Home() {
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const testEndpoint = async (endpoint: string, method: 'GET' | 'POST' = 'GET') => {
        setLoading(true);
        try {
            const options: RequestInit = {
                method,
                credentials: 'include', // Include cookies for authentication
                ...(method === 'POST' && {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: 'Hello from Next.js client!',
                        timestamp: new Date().toISOString()
                    })
                })
            };

            const res = await fetch(endpoint, options);
            const data = await res.json();
            setResponse(data);
        } catch (error) {
            setResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Request failed'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <Head>
                <title>Better Middleware - Next.js Example</title>
                <meta name="description" content="Next.js API routes with Better Auth middleware" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main>
                <h1 style={{ color: '#0070f3', marginBottom: '2rem' }}>
                    Better Middleware - Next.js Example
                </h1>

                <div style={{ marginBottom: '2rem' }}>
                    <p>
                        This example demonstrates Better Auth middleware integration with Next.js API routes.
                        You need to be authenticated with Better Auth to access the protected endpoints.
                    </p>
                </div>

                <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                    <h2>Public Endpoints</h2>
                    <button
                        onClick={() => testEndpoint('/api/health')}
                        disabled={loading}
                        style={buttonStyle}
                    >
                        Test Health Check
                    </button>

                    <h2>Protected Endpoints (Authentication Required)</h2>
                    <button
                        onClick={() => testEndpoint('/api/profile')}
                        disabled={loading}
                        style={buttonStyle}
                    >
                        Test Profile (GET)
                    </button>

                    <button
                        onClick={() => testEndpoint('/api/dashboard')}
                        disabled={loading}
                        style={buttonStyle}
                    >
                        Test Dashboard (GET)
                    </button>

                    <button
                        onClick={() => testEndpoint('/api/data', 'POST')}
                        disabled={loading}
                        style={buttonStyle}
                    >
                        Test Data Submission (POST)
                    </button>

                    <h2>Admin Endpoints (Admin Role Required)</h2>
                    <button
                        onClick={() => testEndpoint('/api/admin/users')}
                        disabled={loading}
                        style={buttonStyle}
                    >
                        Test Admin Users (GET)
                    </button>
                </div>

                {loading && (
                    <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                        Loading...
                    </div>
                )}

                {response && !loading && (
                    <div style={{
                        padding: '1rem',
                        backgroundColor: response.success === false ? '#ffe6e6' : '#e6ffe6',
                        borderRadius: '4px',
                        border: `1px solid ${response.success === false ? '#ff6b6b' : '#51cf66'}`
                    }}>
                        <h3>Response:</h3>
                        <pre style={{
                            overflow: 'auto',
                            backgroundColor: 'white',
                            padding: '1rem',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}>
                            {JSON.stringify(response, null, 2)}
                        </pre>
                    </div>
                )}

                <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <h3>Setup Instructions:</h3>
                    <ol>
                        <li>Make sure your Better Auth server is running on <code>http://localhost:3000</code></li>
                        <li>Authenticate with Better Auth to get a session cookie</li>
                        <li>Test the protected endpoints above</li>
                        <li>For admin endpoints, ensure your user has admin role</li>
                    </ol>

                    <h4>Environment Variables:</h4>
                    <pre style={{ backgroundColor: 'white', padding: '0.5rem', borderRadius: '4px', fontSize: '12px' }}>
                        {`BETTER_AUTH_URL=http://localhost:3000
NODE_ENV=development`}
                    </pre>
                </div>
            </main>
        </div>
    );
}

const buttonStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
};