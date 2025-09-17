'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Globe component with SSR disabled
const Globe = dynamic(() => import('../components/globe/Globe').then(mod => mod.Globe), {
    ssr: false,
    loading: () => <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#050505',
        color: '#00ff00',
        fontFamily: "'Courier New', Courier, monospace"
    }}>Loading 3D Globe...</div>
});

export default function HomePage() {
    return (
            <main>
                {/* You can add other page content here if you want */}
                <Globe />
            </main>
    );
}
