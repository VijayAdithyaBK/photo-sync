import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TransferredFile } from '../types';
import { Download, Copy, Check, File, Search, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Peer } from 'peerjs';

const Receiver: React.FC = () => {
    const [peerId, setPeerId] = useState<string>('');
    const [status, setStatus] = useState<string>('Init');
    const [files, setFiles] = useState<TransferredFile[]>([]);
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const peerRef = useRef<any>(null);

    useEffect(() => {
        const peer = new Peer(undefined, { debug: 3 });
        peer.on('open', (id: string) => { console.log("My Peer ID:", id); setPeerId(id); setStatus('Ready'); });
        peer.on('connection', (conn: any) => {
            setStatus('Connected');
            let incomingMeta: any = null;
            let receivedChunks: BlobPart[] = [];
            conn.on('data', (data: any) => {
                if (data.type === 'meta') { incomingMeta = data.meta; receivedChunks = []; }
                else if (data.type === 'file') { if (incomingMeta) receivedChunks.push(data.payload); }
                else if (data.type === 'complete') {
                    if (incomingMeta && receivedChunks.length > 0) {
                        const blob = new Blob(receivedChunks, { type: incomingMeta.mime });
                        const meta = incomingMeta; // Capture meta locally to avoid closure staleness/null issues
                        setFiles(prev => [{ id: crypto.randomUUID(), name: meta.name, type: meta.mime, size: blob.size, url: URL.createObjectURL(blob), blob }, ...prev]);
                        incomingMeta = null; receivedChunks = [];
                    }
                }
            });
            conn.on('close', () => setStatus('Disconnected'));
        });
        peerRef.current = peer;
        return () => peer.destroy();
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(peerId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleDownloadAll = () => {
        filteredFiles.forEach((file) => {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    return (
        <div className="flex flex-col h-full bg-cream relative overflow-hidden">

            {/* Hero / ID Section */}
            <div className="p-6 pb-2">
                <div className="bg-white border-2 border-retro-dark rounded-[2rem] p-6 shadow-retro relative overflow-hidden">
                    {/* Decorative Sunburst */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-5">
                        <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <line key={i} x1="50" y1="50" x2="50" y2="0" transform={`rotate(${i * 30} 50 50)`} stroke="currentColor" strokeWidth="2" />
                            ))}
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        {peerId ? (
                            <>
                                <div className="p-3 bg-white border-2 border-retro-dark rounded-xl mb-4">
                                    <QRCodeSVG value={peerId} size={200} level="L" />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`w-2 h-2 rounded-full ${status === 'Connected' ? 'bg-retro-green' : 'bg-retro-red animate-pulse'}`}></span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                        {status === 'Connected' ? 'Device Linked' : 'Scan to Link'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="font-mono text-sm bg-cream px-4 py-2 rounded-lg border border-retro-dark flex items-center gap-2 hover:bg-retro-dark hover:text-white transition-colors"
                                >
                                    {peerId}
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </button>
                            </>
                        ) : (
                            <div className="h-40 flex items-center justify-center">
                                <span className="font-serif text-gray-400 animate-pulse">Initializing...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* File List Section */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-baseline gap-2">
                        <h3 className="font-serif text-3xl text-retro-dark">Received</h3>
                        <span className="text-sm font-bold text-gray-400">({files.length})</span>
                    </div>
                    {filteredFiles.length > 0 && (
                        <button
                            onClick={handleDownloadAll}
                            className="flex items-center gap-2 bg-retro-dark text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-retro-red transition-colors shadow-retro-sm active:shadow-none active:translate-y-[2px]"
                        >
                            <Archive className="w-3 h-3" />
                            Save All
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="relative mb-6 group">
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search files..."
                        className="w-full bg-white border-2 border-retro-dark rounded-full py-3 pl-10 pr-4 text-sm font-sans placeholder-gray-400 focus:outline-none transition-shadow shadow-[2px_2px_0px_0px_#2D2D2D] focus:shadow-retro-sm"
                    />
                    <Search className="w-4 h-4 text-retro-dark absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                </div>

                <div className="space-y-3">
                    <AnimatePresence mode='popLayout'>
                        {filteredFiles.map((file) => (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                layout
                                className="flex items-center gap-4 p-3 bg-white border-2 border-retro-dark rounded-xl shadow-retro-sm"
                            >
                                {/* Thumbnail */}
                                <div className="w-12 h-12 shrink-0 bg-cream rounded-lg border-2 border-retro-dark overflow-hidden relative">
                                    {file.type.startsWith('image/') ? (
                                        <img src={file.url} className="w-full h-full object-cover" alt={file.name} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-retro-green/10 text-retro-green">
                                            <File className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-retro-dark text-sm truncate">{file.name}</h4>
                                    <span className="text-[10px] font-mono text-gray-500">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                                </div>

                                {/* Circular Action Button */}
                                <a
                                    href={file.url}
                                    download={file.name}
                                    className="w-10 h-10 rounded-full bg-cream border-2 border-retro-dark text-retro-dark flex items-center justify-center hover:bg-retro-green hover:text-white transition-colors"
                                    title="Download"
                                >
                                    <Download className="w-4 h-4" strokeWidth={2.5} />
                                </a>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredFiles.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-12 opacity-60"
                        >
                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-retro-dark flex items-center justify-center mb-4 bg-white">
                                <Download className="w-8 h-8 text-retro-dark" />
                            </div>
                            <p className="text-sm font-bold text-retro-dark uppercase tracking-widest">
                                {files.length === 0 ? "No files received" : "No results found"}
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Receiver;