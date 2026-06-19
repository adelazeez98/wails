
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ChevronRight, ChevronLeft, Grid3x3, CaseSensitive, Shuffle, Columns, FileText, Settings, Key } from 'lucide-react';
import { playfairCipher, PlayfairTrace } from '@/lib/ciphers/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface PlayfairVisualizerProps {
  text: string;
  keyString: string;
  action: 'encrypt' | 'decrypt';
  onBack: () => void;
}

export function PlayfairVisualizer({ text, keyString, action, onBack }: PlayfairVisualizerProps) {
  const [step, setStep] = useState(0);

  const decrypt = action === 'decrypt';
  const data: PlayfairTrace = playfairCipher(text, keyString, decrypt);
  
  const totalSteps = (decrypt ? 1 : 2) + data.processingSteps.length;

  const renderMatrixGrid = (highlightCoords: [number, number][] = []) => (
    <div className="flex justify-center">
        <Table className="w-auto border">
            <TableBody>
            {data.matrix.map((row, r) => (
                <TableRow key={r}>
                {row.map((char, c) => (
                    <TableCell 
                    key={c} 
                    className={cn(
                        "text-center font-mono font-bold text-lg p-3 w-14 h-14 border",
                        highlightCoords.some(([hr, hc]) => hr === r && hc === c) && 'bg-primary/20 text-primary ring-2 ring-primary'
                    )}>
                    {char}
                    </TableCell>
                ))}
                </TableRow>
            ))}
            </TableBody>
        </Table>
    </div>
  );

  const renderMatrixStep = () => (
    <div className="space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2"><Key className="w-5 h-5 text-primary" /> Step 1: Generate 5x5 Key Matrix</h3>
      <p className="text-sm text-muted-foreground">The matrix is built from the unique characters of the key (<code className="font-mono bg-muted p-1 rounded">{data.cleanedKey}</code>), with 'J' replaced by 'I'. The remaining alphabet characters fill the rest of the grid.</p>
      {renderMatrixGrid()}
    </div>
  );

  const renderPreparationStep = () => (
    <div className="space-y-6">
      <h3 className="font-bold text-lg flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> Step 2: Prepare Plaintext</h3>
      <div className="space-y-2">
        <p className="text-sm font-semibold">1. Clean and Normalize</p>
        <p className="text-sm text-muted-foreground">Remove non-alphabetic characters and convert 'J' to 'I'.</p>
        <div className="p-2 bg-secondary/30 rounded font-mono text-sm break-all">{data.originalText.replace(/J/g, 'I')}</div>
      </div>
       <div className="space-y-2">
        <p className="text-sm font-semibold">2. Form Digraphs</p>
        <p className="text-sm text-muted-foreground">Group letters into pairs. If a pair contains identical letters, or if the text has an odd number of letters, insert an 'X'.</p>
        <div className="p-2 bg-primary/20 rounded font-mono text-sm break-all">{data.preparedText}</div>
      </div>
    </div>
  );

  const renderProcessingStep = () => {
    const processStepIndex = step - (decrypt ? 1 : 2);
    if (processStepIndex < 0 || processStepIndex >= data.processingSteps.length) return null;
    
    const currentStepData = data.processingSteps[processStepIndex];
    const { inputDigraph, outputDigraph, rule, coords } = currentStepData;
    const { char1, pos1, char2, pos2, newChar1, newPos1, newChar2, newPos2 } = coords;

    const ruleDescription = {
        row: 'Characters are in the same row. Each is replaced by the character to its right (wrapping around).',
        column: 'Characters are in the same column. Each is replaced by the character below it (wrapping around).',
        rectangle: 'Characters form a rectangle. Replace them with the characters on the same row, but at the other corner of the rectangle.',
    };
    if (decrypt) {
        ruleDescription.row = 'Characters are in the same row. Each is replaced by the character to its left (wrapping around).';
        ruleDescription.column = 'Characters are in the same column. Each is replaced by the character above it (wrapping around).';
    }


    return (
        <div className="space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-primary" /> 
                Step {step + 1}: Processing Digraph "{inputDigraph}"
            </h3>
            
            <div className="space-y-1">
                <p className="font-semibold">Rule applied: <span className="capitalize text-accent">{rule}</span></p>
                <p className="text-sm text-muted-foreground">{ruleDescription[rule]}</p>
            </div>

            {renderMatrixGrid([pos1, pos2])}

            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-secondary/30 rounded border">
                    <p className="text-xs text-muted-foreground">Input</p>
                    <p className="font-mono text-2xl font-bold">{inputDigraph}</p>
                </div>
                <div className="p-3 bg-primary/20 rounded border border-primary/30">
                    <p className="text-xs text-primary/80">Output</p>
                    <p className="font-mono text-2xl font-bold text-primary">{outputDigraph}</p>
                </div>
            </div>
        </div>
    );
  };
  
  const currentStepView = () => {
    if (step === 0) return renderMatrixStep();
    if (!decrypt && step === 1) return renderPreparationStep();
    return renderProcessingStep();
  }

  const renderFinalStep = () => {
      const finalStepIndex = (decrypt ? 1 : 2) + data.processingSteps.length;
      if (step !== finalStepIndex) return null;

      return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Final Result</h3>
            <p className="text-sm text-muted-foreground">All digraphs have been processed. The final result is the concatenation of all output digraphs.</p>
             <div className="p-4 bg-primary/20 rounded-lg font-mono break-all border border-primary/30">
                <div className="text-xs text-primary/80 mb-1 uppercase tracking-tighter">Final {decrypt ? 'Plaintext' : 'Ciphertext'}</div>
                <div className="text-lg font-bold text-primary">{data.output}</div>
            </div>
        </div>
      );
  };

  const finalStepIndex = (decrypt ? 1 : 2) + data.processingSteps.length;
  
  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl border-2 border-primary/20">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Exit Visualizer
          </Button>
          <div className="text-right">
            <CardTitle className="text-xl font-headline">Playfair {decrypt ? 'Decryption' : 'Encryption'} Trace</CardTitle>
            <CardDescription>Step-by-step breakdown</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="min-h-[440px] flex flex-col justify-between">
          <ScrollArea className="h-[440px] pr-4">
            <div className="animate-in fade-in slide-in-from-right-4">
                {step < finalStepIndex ? currentStepView() : renderFinalStep()}
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
              <Badge variant="outline" className="font-mono">Step {step + 1} / {totalSteps + 1}</Badge>
              <Button 
                variant="default" 
                size="sm"
                disabled={step === totalSteps}
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
