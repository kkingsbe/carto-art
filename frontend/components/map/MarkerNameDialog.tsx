import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MarkerNameDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string) => void;
    initialLat: number;
    initialLng: number;
}

export function MarkerNameDialog({
    isOpen,
    onClose,
    onConfirm,
    initialLat,
    initialLng,
}: MarkerNameDialogProps) {
    const [name, setName] = useState('');

    // Reset name when dialog opens
    useEffect(() => {
        if (isOpen) {
            setName('New Marker');
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (name.trim()) {
            onConfirm(name.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Marker to Map</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <p className="text-sm text-gray-500">
                        Enter a specific name for this location at <span className="font-mono text-xs">{initialLat.toFixed(4)}, {initialLng.toFixed(4)}</span>
                    </p>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Marker Name"
                        autoFocus
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <DialogFooter className="flex gap-2 sm:justify-end">
                    <Button variant="outline" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={!name.trim()} type="button">
                        Add Marker
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
