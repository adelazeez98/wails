
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ChevronRight, ChevronLeft, Grid3x3, CaseSensitive, Shuffle, Hash, Columns, FileText } from 'lucide-react';
import { adfgvxCipher } from '@/lib/ciphers/adfgvx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ADFGVXStepData = ReturnType<typeof adfgvxCipher>;

interface ADFGVXVisualizerProps {
  text: string;
  square: string;
  transpositionKey: string;
  action: 'encrypt-no-padding' | 'encrypt-with-padding' | 'decrypt';
  onBack: () => void;
}

const ADFGVX_HEADERS = "ADFGVX".split('');

export function ADFGVXVisualizer({ text, square, transpositionKey, action, onBack }: ADFGVXVisualizerProps) {
  const [step, setStep] = useState(0);

  const decrypt = action === 'decrypt';
  const usePadding = action === 'encrypt-with-padding';
  const data: ADFGVXStepData = adfgvxCipher(text, square, transpositionKey, decrypt, usePadding ? 'A' : undefined);
  
  const isEncrypt = !decrypt;
  const totalSteps = isEncrypt ? 3 : 4; 

  const renderPolybiusSquare = () => (
    <div className="space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2"><Grid3x3 className="w-5 h-5 text-primary" /> Step 1: Polybius Square</h3>
      <p className="text-sm text-muted-foreground">The substitution square is created from the keyword, followed by the remaining characters of A-Z and 0-9.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            {ADFGVX_HEADERS.map(h => <TableHead key={h} className="text-center font-bold text-accent">{h}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ADFGVX_HEADERS.map((h, r) => (
            <TableRow key={h}>
              <TableHead className="font-bold text-accent">{h}</TableHead>
              {data.fullSquare.substring(r * 6, (r * 6) + 6).split('').map((char, c) => (
                <TableCell key={c} className="text-center font-mono font-bold">{char}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderEncryptionSteps = () => {
    switch(step) {
        case 0: return renderPolybiusSquare();
        case 1: return (
            <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><CaseSensitive className="w-5 h-5 text-primary" /> Step 2: Fractionation</h3>
                <p className="text-sm text-muted-foreground">Each character of the cleaned plaintext (<code className="font-mono bg-muted p-1 rounded">{data.cleanedText}</code>) is replaced by its two-letter coordinate from the square (Row + Column).</p>
                
                <div className="p-3 bg-secondary/20 border rounded-lg">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Substitution Details</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {data.fractionationDetails?.map(({ char, coord }, index) => (
                            <div key={index} className="flex items-center gap-2 font-mono text-sm">
                                <span className="font-bold text-foreground">{char}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-bold text-accent">{coord}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-secondary/30 rounded-lg font-mono break-all border mt-4">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter">Resulting Fractionated Text</div>
                    <div className="text-md font-bold">{data.fractionated}</div>
                </div>
            </div>
        );
        case 2: return (
             <div className="space-y-6">
                <h3 className="font-bold text-lg flex items-center gap-2"><Columns className="w-5 h-5 text-primary" /> Step 3: Columnar Transposition</h3>
                <p className="text-sm text-muted-foreground">The fractionated text is written into a grid under the transposition key. The columns are then read out in the key's alphabetical order.</p>
                <div>
                    <h4 className="font-semibold text-md mb-2">3a: Write into grid</h4>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {transpositionKey.toUpperCase().split('').map((h, i) => <TableHead key={i} className="text-center font-bold text-accent">{h}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.transpositionGrid?.map((row, r) => (
                                <TableRow key={r}>
                                    {row.map((cell, c) => <TableCell key={c} className="text-center font-mono">{cell || <span className="text-muted-foreground/50">-</span>}</TableCell>)}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div>
                    <h4 className="font-semibold text-md mb-2 mt-4">3b: Read columns by sorted key (<code className="font-mono bg-muted p-1 rounded">{data.transpositionKeySorted}</code>)</h4>
                    <div className="p-4 bg-primary/20 rounded-lg font-mono break-all border border-primary/30">
                        <div className="text-xs text-primary/80 mb-1 uppercase tracking-tighter">Final Ciphertext</div>
                        <div className="text-lg font-bold text-primary">{data.output}</div>
                    </div>
                </div>
            </div>
        );
        default: return null;
    }
  };
  
  const renderDecryptionSteps = () => {
    switch(step) {
        case 0: return renderPolybiusSquare();
        case 1: return (
             <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><Columns className="w-5 h-5 text-primary" /> Step 2: Reconstruct Columns</h3>
                <p className="text-sm text-muted-foreground">The ciphertext is divided into columns under the sorted transposition key (<code className="font-mono bg-muted p-1 rounded">{data.transpositionKeySorted}</code>). Column lengths are calculated based on the ciphertext length.</p>
                <div className="flex flex-wrap gap-4">
                    {data.decryptionColumns?.sort((a,b) => a.header.localeCompare(b.header)).map(({header, column, originalIndex}, i) => (
                        <div key={i} className="p-3 bg-secondary/30 rounded-md border flex-grow basis-24">
                            <div className="text-sm text-muted-foreground uppercase mb-1 font-bold">{header}</div>
                            <div className="font-mono text-sm font-bold break-all">{column || <span className="text-muted-foreground/50">-</span>}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
        case 2: return (
            <div className="space-y-6">
                <h3 className="font-bold text-lg flex items-center gap-2"><Shuffle className="w-5 h-5 text-primary" /> Step 3: Reconstruct Grid</h3>
                <p className="text-sm text-muted-foreground">The columns are placed back into a grid according to their original positions under the key (<code className="font-mono bg-muted p-1 rounded">{transpositionKey.toUpperCase()}</code>). Reading across the rows reveals the fractionated text.</p>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            {transpositionKey.toUpperCase().split('').map((h, i) => <TableHead key={i} className="text-center font-bold text-accent">{h}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.reconstructedGrid?.map((row, r) => (
                            <TableRow key={r}>
                                {row.map((cell, c) => <TableCell key={c} className="text-center font-mono">{cell || <span className="text-muted-foreground/50">-</span>}</TableCell>)}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <div className="p-4 bg-secondary/30 rounded-lg font-mono break-all border mt-4">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter">Recovered Fractionated Text</div>
                    <div className="text-md font-bold">{data.fractionated}</div>
                </div>
            </div>
        );
        case 3: return (
            <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Step 4: Defractionate</h3>
                <p className="text-sm text-muted-foreground">Pairs of letters from the fractionated text are looked up in the Polybius Square to find the original plaintext characters.</p>
                 <div className="p-4 bg-primary/20 rounded-lg font-mono break-all border border-primary/30">
                    <div className="text-xs text-primary/80 mb-1 uppercase tracking-tighter">Final Plaintext</div>
                    <div className="text-lg font-bold text-primary">{data.output}</div>
                </div>
            </div>
        );
        default: return null;
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl border-2 border-primary/20">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Exit Visualizer
          </Button>
          <div className="text-right">
            <CardTitle className="text-xl font-headline">ADFGVX {isEncrypt ? 'Encryption' : 'Decryption'} Trace</CardTitle>
            <CardDescription>Step-by-step breakdown</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="min-h-[440px] flex flex-col justify-between">
          <ScrollArea className="h-[440px] pr-4">
            <div className="animate-in fade-in slide-in-from-right-4">
             {isEncrypt ? renderEncryptionSteps() : renderDecryptionSteps()}
            </div>
          </ScrollArea>
          <div className="mt-8 pt-6 border-t flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm"
                disabled={step === 0}
                onClick={() => setStep(prev => prev - 1)}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <Badge variant="outline" className="font-mono">Step {step + 1} / {totalSteps}</Badge>
              <Button 
                variant="default" 
                size="sm"
                disabled={step === totalSteps - 1}
                onClick={() => setStep(prev => prev + 1)}
                className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
