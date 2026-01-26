 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import type { ReservationRow } from "@/pages/app/reservations/ReservationsTableCard";
 
 export function ReservationDetailDialog({
   reservation,
   open,
   onOpenChange,
 }: {
   reservation: ReservationRow | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }) {
   if (!reservation) return null;
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg">
         <DialogHeader>
           <DialogTitle>Reservation Details</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4">
           <div className="flex items-center justify-between">
             <div>
               <div className="text-sm font-medium text-muted-foreground">Guest</div>
               <div className="mt-1 text-lg font-semibold">
                 {(reservation.first_name || "") + " " + (reservation.last_name || "")}
               </div>
             </div>
             <Badge variant="secondary" className="capitalize">
               {(reservation.status || "").replace("_", " ")}
             </Badge>
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             <div>
               <div className="text-sm font-medium text-muted-foreground">Room Number</div>
               <div className="mt-1 text-base font-medium">{reservation.room_number ?? "—"}</div>
             </div>
 
             <div>
               <div className="text-sm font-medium text-muted-foreground">Nights</div>
               <div className="mt-1 text-base">{reservation.nights ?? 0} nights</div>
             </div>
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             <div>
               <div className="text-sm font-medium text-muted-foreground">Check-in</div>
               <div className="mt-1">{reservation.check_in_date ?? "—"}</div>
             </div>
 
             <div>
               <div className="text-sm font-medium text-muted-foreground">Check-out</div>
               <div className="mt-1">{reservation.check_out_date ?? "—"}</div>
             </div>
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             <div>
               <div className="text-sm font-medium text-muted-foreground">Total Amount</div>
               <div className="mt-1 text-lg font-semibold">${Number(reservation.total_amount ?? 0).toFixed(2)}</div>
             </div>
 
             <div>
               <div className="text-sm font-medium text-muted-foreground">Balance Due</div>
              <div className="mt-1 text-lg font-semibold text-[hsl(var(--brand-warm))]">
                 ${Number(reservation.balance_due ?? 0).toFixed(2)}
               </div>
             </div>
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