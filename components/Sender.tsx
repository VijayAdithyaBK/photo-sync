import React, { useState, useEffect, useRef } from 'react';
import { HistoryItem } from '../types';
import { Send, Check, AlertCircle, Loader2, Plus, X, Link, Scan, Pause, File as FileIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from "html5-qrcode";
import { Peer } from 'peerjs';

const Sender: React.FC = () => {
    const [targetId, setTargetId] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState('Disconnected');
    const [items, setItems] = useState<HistoryItem[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    // Duplicate handling state
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [duplicateFiles, setDuplicateFiles] = useState<File[]>([]);

    const peerRef = useRef<any>(null);
    const connRef = useRef<any>(null);
    const cancelRef = useRef(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    // Initialize Peer
    useEffect(() => {
        const peer = new Peer(undefined, {
            debug: 2,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        });
        peer.on('open', (id: string) => console.log('ID:', id));
        peer.on('error', (err: any) => {
            setIsConnected(false); setIsSending(false); setError('Connection failed');
        });
        peerRef.current = peer;
        return () => peer.destroy();
    }, []);

    // Cleanup previews
    useEffect(() => {
        return () => items.forEach(item => URL.revokeObjectURL(item.preview));
    }, []);

    // QR Scanning with html5-qrcode
    useEffect(() => {
        if (isScanning) {
            // Short timeout to ensure DOM is ready
            const timer = setTimeout(() => {
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                const config = { fps: 10, qrbox: { width: 250, height: 250 } };

                html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        console.log("QR Code detected:", decodedText);
                        setTargetId(decodedText);
                        setIsScanning(false);
                        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
                    },
                    (errorMessage) => {
                        // ignore errors during scanning
                    }
                ).catch(err => {
                    console.error("Error starting scanner:", err);
                    setError("Camera failed: " + err);
                    setIsScanning(false);
                });
            }, 100);

            return () => {
                clearTimeout(timer);
                if (scannerRef.current) {
                    try {
                        scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => { });
                    } catch (e) { /* ignore */ }
                    scannerRef.current = null;
                }
            };
        }
    }, [isScanning]);

    const connectToPc = () => {
        console.log("Attempting to connect to:", targetId);
        if (!peerRef.current || !targetId) return;
        setStatus('Linking...');

        // Timeout safety
        const timeout = setTimeout(() => {
            if (!connRef.current?.open) {
                console.error("Connection timed out");
                setError("Connection Timed Out. Firewalls?");
                setStatus('Disconnected');
                setIsConnected(false);
            }
        }, 5000);

        try {
            const conn = peerRef.current.connect(targetId.trim(), { reliable: true });
            conn.on('open', () => {
                clearTimeout(timeout);
                console.log("Connection opened to " + targetId);
                setIsConnected(true);
                setStatus('Linked');
                connRef.current = conn;
            });
            conn.on('close', () => { console.log("Connection closed"); setIsConnected(false); connRef.current = null; setStatus('Disconnected'); setIsSending(false); });
            conn.on('error', (err: any) => { clearTimeout(timeout); console.error("Connection error:", err); setIsConnected(false); setError("Failed: " + err); });
        } catch (err: any) { clearTimeout(timeout); console.error("Peer connect error:", err); setError(err.message); }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles: File[] = Array.from(e.target.files);

            // Identify duplicates (check if file exists in the current items list by name and size)
            const duplicates = selectedFiles.filter(file =>
                items.some(item => item.file.name === file.name && item.file.size === file.size)
            );

            if (duplicates.length > 0) {
                setPendingFiles(selectedFiles);
                setDuplicateFiles(duplicates);
                setShowDuplicateModal(true);
                e.target.value = ''; // Reset input to allow re-selection
            } else {
                addFiles(selectedFiles);
                e.target.value = '';
            }
        }
    };

    const addFiles = (filesToAdd: File[]) => {
        const newItems = filesToAdd.map((file) => ({
            id: crypto.randomUUID(),
            file,
            preview: URL.createObjectURL(file),
            status: 'queued' as const,
            progress: 0
        }));
        setItems(prev => [...prev, ...newItems]);
    };

    const resolveDuplicates = (action: 'send_again' | 'skip') => {
        // Ensure we treat these as File[] to avoid unknown type errors
        const currentPending = pendingFiles as File[];
        const currentDuplicates = duplicateFiles as File[];

        if (action === 'send_again') {
            addFiles(currentPending);
        } else {
            // Filter out duplicates from pendingFiles by reference or name/size check
            const nonDuplicates = currentPending.filter((f: File) => !currentDuplicates.some((d: File) => d.name === f.name && d.size === f.size));
            addFiles(nonDuplicates);
        }
        // Reset
        setShowDuplicateModal(false);
        setPendingFiles([]);
        setDuplicateFiles([]);
    };

    const sendFiles = async () => {
        if (!connRef.current) return setError("Not connected");
        setIsSending(true);
        cancelRef.current = false;

        const queue = items.filter(i => i.status === 'queued' || i.status === 'error');

        for (const item of queue) {
            if (cancelRef.current || !connRef.current?.open) break;
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'sending' } : i));

            try {
                connRef.current.send({ type: 'meta', meta: { name: item.file.name, size: item.file.size, mime: item.file.type } });
                const buffer = await item.file.arrayBuffer();
                connRef.current.send({ type: 'file', payload: buffer });
                connRef.current.send({ type: 'complete' });
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'sent', progress: 100 } : i));
                await new Promise(r => setTimeout(r, 200)); // Visual delay
            } catch (err) {
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
            }
        }
        setIsSending(false);
    };

    return (
        <div className="flex flex-col h-full bg-cream relative">
            {/* Connection Bar - Top */}
            <div className="px-6 py-4">
                <div className="flex gap-2">
                    <div className="flex-1 h-12 relative">
                        <input
                            type="text"
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            placeholder="Enter ID"
                            disabled={isConnected}
                            className={`w-full h-full bg-white border-2 border-retro-dark rounded-full pl-4 pr-12 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-retro-red/20 ${isConnected ? 'text-retro-green font-bold' : ''}`}
                        />
                        {isConnected ? (
                            <button onClick={() => { connRef.current?.close(); setIsConnected(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-retro-dark hover:bg-gray-100 rounded-full">
                                <X className="w-4 h-4" />
                            </button>
                        ) : (
                            <button onClick={() => setIsScanning(true)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-retro-dark hover:bg-gray-100 rounded-full">
                                <Scan className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {!isConnected && (
                        <button onClick={connectToPc} disabled={!targetId} className="h-12 w-12 bg-retro-dark text-white border-2 border-retro-dark rounded-full flex items-center justify-center shadow-retro-sm active:shadow-none active:translate-y-[2px] transition-all disabled:opacity-50">
                            <Link className="w-5 h-5" />
                        </button>
                    )}
                </div>
                {error && <div className="mt-2 text-xs font-bold text-retro-red bg-white border border-retro-red px-2 py-1 inline-block rounded-md">{error}</div>}
                {!isConnected && !error && <div className="mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center">⚠️ Ensure both devices are on the Same WiFi</div>}
            </div>

            {/* QR Scanner */}
            <AnimatePresence>
                {isScanning && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-retro-dark/95 flex flex-col items-center justify-center p-6">
                        <div className="w-full max-w-xs aspect-square border-4 border-white rounded-3xl overflow-hidden relative shadow-2xl bg-black">
                            <style>{`
                                #reader video { object-fit: cover; width: 100% !important; height: 100% !important; border-radius: 1.5rem; }
                                #reader { width: 100% !important; height: 100% !important; border: none !important; }
                            `}</style>
                            <div id="reader" className="w-full h-full"></div>
                        </div>
                        <button onClick={() => { setIsScanning(false); if (scannerRef.current) scannerRef.current.stop().then(() => scannerRef.current?.clear()); }} className="mt-8 bg-white text-retro-dark px-8 py-3 rounded-full font-bold border-2 border-transparent hover:border-retro-red">Close Camera</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Duplicate Resolution Modal */}
            <AnimatePresence>
                {showDuplicateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white border-2 border-retro-dark rounded-2xl p-6 shadow-retro max-w-sm w-full"
                        >
                            <div className="flex items-center gap-3 text-retro-red mb-4">
                                <AlertCircle className="w-8 h-8" />
                                <h3 className="font-serif text-2xl text-retro-dark">Duplicates?</h3>
                            </div>
                            <p className="text-gray-600 mb-6 text-sm">
                                <span className="font-bold text-retro-dark">{duplicateFiles.length} file(s)</span> already exist in the queue or have been sent. Do you want to send them again?
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => resolveDuplicates('skip')}
                                    className="w-full bg-retro-dark text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-retro-green transition-colors"
                                >
                                    Skip Duplicates
                                </button>
                                <button
                                    onClick={() => resolveDuplicates('send_again')}
                                    className="w-full bg-transparent border-2 border-retro-dark text-retro-dark py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-gray-50 transition-colors"
                                >
                                    Send Again
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Playlist Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-40">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-baseline gap-2">
                        <h2 className="font-serif text-3xl text-retro-dark">Queue</h2>
                        <span className="text-sm font-bold text-gray-400">({items.length})</span>
                    </div>
                    <label className="cursor-pointer bg-white border-2 border-retro-dark px-3 py-1.5 rounded-full flex items-center gap-2 hover:bg-retro-green hover:text-white hover:border-retro-green transition-colors shadow-retro-sm">
                        <span className="text-xs font-bold uppercase tracking-wider">Add</span>
                        <Plus className="w-4 h-4" />
                        <input type="file" multiple onChange={handleFileSelect} className="hidden" />
                    </label>
                </div>

                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={item.id} className={`flex items-center gap-4 p-3 bg-white border-2 rounded-xl transition-all ${item.status === 'sending' ? 'border-retro-red shadow-retro-sm' : 'border-gray-200'}`}>
                            <div className="w-12 h-12 shrink-0 bg-gray-100 rounded-lg border-2 border-gray-100 overflow-hidden relative">
                                {item.file.type.startsWith('image/')
                                    ? <img src={item.preview} className="w-full h-full object-cover" alt="" />
                                    : <div className="w-full h-full flex items-center justify-center"><FileIcon className="w-6 h-6 text-gray-400" /></div>
                                }
                                {item.status === 'sending' && (
                                    <div className="absolute inset-0 bg-retro-red/20 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-retro-red animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-retro-dark text-sm truncate">{item.file.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-mono text-gray-500">{(item.file.size / 1024 / 1024).toFixed(1)}MB</span>
                                    {item.status === 'sent' && <span className="text-[10px] font-bold text-retro-green bg-retro-green/10 px-1.5 rounded-sm">SENT</span>}
                                    {item.status === 'error' && <span className="text-[10px] font-bold text-retro-red bg-retro-red/10 px-1.5 rounded-sm">ERROR</span>}
                                </div>
                            </div>
                            <div className="text-xs font-serif text-gray-400">
                                {index + 1 < 10 ? `0${index + 1}` : index + 1}
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="py-12 border-2 border-dashed border-gray-300 rounded-xl text-center">
                            <p className="font-serif text-gray-400 text-lg">Empty Queue</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Audio Player Style Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-retro-red rounded-t-[2.5rem] p-6 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Status</span>
                        <span className="text-white font-serif text-xl">
                            {isSending ? 'Transmitting...' : items.length > 0 ? 'Ready to Send' : 'Idle'}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Circular Progress/Play Button */}
                        <button
                            onClick={isSending ? () => cancelRef.current = true : sendFiles}
                            disabled={items.length === 0 || !isConnected}
                            className="w-16 h-16 bg-cream rounded-full flex items-center justify-center border-4 border-retro-dark shadow-retro transition-transform active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:shadow-none disabled:border-gray-400"
                        >
                            {isSending ? (
                                <Pause className="w-6 h-6 text-retro-dark fill-current" />
                            ) : (
                                <Send className="w-6 h-6 text-retro-dark fill-current ml-1" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Progress Bar Visual */}
                <div className="mt-6 flex items-end gap-1 h-8 opacity-50">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-white rounded-t-sm transition-all duration-300"
                            style={{
                                height: isSending ? `${Math.random() * 100}%` : '20%',
                                opacity: isSending ? 1 : 0.3
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Sender;