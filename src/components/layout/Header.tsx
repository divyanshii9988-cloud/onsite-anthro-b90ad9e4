import { Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export function Header() {
  const { user, selectedCorporate, assignedCorporates, selectCorporate, corporates } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  
  // Admin sees all corporates as a filter dropdown (optional)
  // Staff see only their assigned corporates
  const showCorporateSelector = isAdmin || assignedCorporates.length > 1;

  return (
    <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Building2 className="w-5 h-5 text-muted-foreground" />
        {showCorporateSelector ? (
          <Select 
            value={selectedCorporate?.id || (isAdmin ? 'all' : '')} 
            onValueChange={(value) => {
              if (value === 'all') {
                // Admin deselects filter to see all
                selectCorporate('');
              } else {
                selectCorporate(value);
              }
            }}
          >
            <SelectTrigger className="w-[280px] border-0 bg-transparent hover:bg-muted/50 focus:ring-0">
              <SelectValue placeholder="Select Corporate" />
            </SelectTrigger>
            <SelectContent>
              {isAdmin && (
                <SelectItem value="all">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">All Corporates</span>
                    <span className="text-xs text-muted-foreground">View data across all locations</span>
                  </div>
                </SelectItem>
              )}
              {(isAdmin ? corporates : assignedCorporates).map((corp) => (
                <SelectItem key={corp.id} value={corp.id}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{corp.name}</span>
                    <span className="text-xs text-muted-foreground">{corp.location}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : selectedCorporate ? (
          <div>
            <p className="font-medium text-sm">{selectedCorporate.name}</p>
            <p className="text-xs text-muted-foreground">{selectedCorporate.location}</p>
          </div>
        ) : (
          <div>
            <p className="font-medium text-sm text-muted-foreground">No Corporate Assigned</p>
          </div>
        )}
      </div>
      
      {!selectedCorporate && !isAdmin && (
        <div className="text-sm text-warning flex items-center gap-2">
          <span className="animate-pulse">⚠️</span>
          Please select a corporate to view data
        </div>
      )}
    </header>
  );
}
