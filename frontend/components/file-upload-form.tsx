"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Upload, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { transactionsApi } from "@/lib/api-client"

// Define type for transaction upload response
interface TransactionUploadResponse {
  message: string;
  count?: number;
  transactions?: any[];
}

const formSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size must be less than 5MB",
    })
    .refine((file) => {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      return ['pdf'].includes(fileExt || '');
    }, {
      message: "Only PDF files are supported",
    }),
});

export function FileUploadForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      console.log("Starting file upload process for:", data.file.name);
      
      // Start with upload progress animation
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          // Only simulate up to 60% for actual upload
          // The rest will happen after API response for processing
          if (prev >= 60) {
            clearInterval(interval);
            return prev;
          }
          return prev + 2; // Slower progress to be more realistic
        });
      }, 100);
      
      try {
        console.log("Calling API to upload file...");
        // Call the actual API to upload the transaction file
        const response = await transactionsApi.upload(data.file) as TransactionUploadResponse;
        console.log("API upload response:", response);
        
        // After successful API response, quickly finish the progress bar
        clearInterval(interval);
        
        // Simulate transaction processing
        let processProgress = 60;
        const processInterval = setInterval(() => {
          processProgress += 5;
          setUploadProgress(processProgress);
          
          if (processProgress >= 100) {
            clearInterval(processInterval);
            
            // Show success message after processing completes
            const successCount = response.count ? response.count : 
                               (response.transactions ? response.transactions.length : 0);
            
            // Determine success message based on transaction count
            let successMessage = "Your transaction data has been processed.";
            if (successCount > 0) {
              successMessage = `Successfully processed ${successCount} transactions.`;
            } else if (response.message) {
              successMessage = response.message;
            }
            
            toast({
              title: "File uploaded successfully",
              description: successMessage,
            });
            
            // Redirect to expenses page after a short delay
            setTimeout(() => {
              router.push('/expenses');
            }, 1500);
          }
        }, 100);
        
      } catch (apiError: any) {
        clearInterval(interval);
        console.error("API Error uploading file:", apiError);
        
        // Handle specific API errors
        const errorMessage = apiError.message || 
                           "There was an error processing your file. Please try again.";
        
        toast({
          title: "Upload failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        setIsUploading(false);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      setIsUploading(false);
      setUploadProgress(0);
      
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("file", file, { shouldValidate: true });
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      form.setValue("file", file, { shouldValidate: true });
    }
  };
  
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };
  
  const selectedFile = form.watch("file");
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-2">Upload Transaction Statements</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Upload your transaction statement PDF to automatically import multiple transactions at once.
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Supported formats: PDF transaction statements</li>
            <li>Transactions will be automatically processed</li>
            <li>Maximum file size: 5MB</li>
            <li>For best results, use detailed statements</li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="file"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel>Transaction Statement</FormLabel>
                <FormControl>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragging ? "border-primary bg-primary/5" : "border-input"
                    } ${value ? "bg-primary/5" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleClickUpload}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <FileText size={48} className="text-primary mb-2" />
                        <div className="font-medium">{selectedFile.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload size={48} className="text-muted-foreground mb-2" />
                        <div className="font-medium">
                          Drag and drop your PDF file here
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          or click to browse
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Upload your transaction statement in PDF format. Max file size 5MB.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {isUploading && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Uploading and processing...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-muted-foreground mt-2">
                  {uploadProgress < 30 ? "Uploading file..." : 
                   uploadProgress < 60 ? "Parsing document..." : 
                   uploadProgress < 80 ? "Extracting transactions..." : 
                   uploadProgress < 95 ? "Categorizing transactions..." : 
                   "Saving to database..."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isUploading || !selectedFile}
        >
          {isUploading ? "Processing..." : "Upload and Process Statement"}
        </Button>
      </form>
    </Form>
  );
} 