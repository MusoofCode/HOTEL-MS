 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import type { ExpenseRow } from "@/pages/app/expenses/ExpensesTableCard";
 
 export function ExpenseDetailDialog({
   expense,
   open,
   onOpenChange,
 }: {
   expense: ExpenseRow | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }) {
   if (!expense) return null;
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg">
         <DialogHeader>
           <DialogTitle>Expense Details</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4">
           <div>
             <div className="text-sm font-medium text-muted-foreground">Description</div>
             <div className="mt-1 text-base">{expense.description}</div>
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             <div>
               <div className="text-sm font-medium text-muted-foreground">Category</div>
               <div className="mt-1">
                 <Badge variant="secondary" className="capitalize">
                   {String(expense.category).replace("_", " ")}
                 </Badge>
               </div>
             </div>
 
             <div>
               <div className="text-sm font-medium text-muted-foreground">Amount</div>
               <div className="mt-1 text-lg font-semibold">${Number(expense.amount).toFixed(2)}</div>
             </div>
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             <div>
               <div className="text-sm font-medium text-muted-foreground">Expense Date</div>
               <div className="mt-1">{expense.expense_date}</div>
             </div>
 
             <div>
               <div className="text-sm font-medium text-muted-foreground">Receipt</div>
               <div className="mt-1">
                 {expense.receipt_path ? (
                   <Badge variant="default">Attached</Badge>
                 ) : (
                   <Badge variant="outline">No receipt</Badge>
                 )}
               </div>
             </div>
           </div>
 
           <div>
             <div className="text-sm font-medium text-muted-foreground">Created</div>
             <div className="mt-1 text-sm">{new Date(expense.created_at).toLocaleString()}</div>
           </div>
 
           <div className="flex justify-end pt-2">
             <Button variant="outline" onClick={() => onOpenChange(false)}>
               Close
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }