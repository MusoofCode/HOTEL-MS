 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import type { CustomerRow } from "@/pages/app/customers/CustomersTableCard";
 
 export function CustomerDetailDialog({
   customer,
   open,
   onOpenChange,
 }: {
   customer: CustomerRow | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }) {
   if (!customer) return null;
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg">
         <DialogHeader>
           <DialogTitle>Customer Details</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4">
           <div>
             <div className="text-sm font-medium text-muted-foreground">Full Name</div>
             <div className="mt-1 text-lg font-semibold">
               {customer.first_name} {customer.last_name}
             </div>
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             <div>
               <div className="text-sm font-medium text-muted-foreground">Email</div>
               <div className="mt-1">{customer.email ?? "—"}</div>
             </div>
 
             <div>
               <div className="text-sm font-medium text-muted-foreground">Phone</div>
               <div className="mt-1">{customer.phone ?? "—"}</div>
             </div>
           </div>
 
           <div>
             <div className="text-sm font-medium text-muted-foreground">Customer Since</div>
             <div className="mt-1 text-sm">{new Date(customer.created_at).toLocaleDateString()}</div>
           </div>
 
           <div className="flex justify-end gap-2 pt-2">
             <Button variant="outline" onClick={() => onOpenChange(false)}>
               Close
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }