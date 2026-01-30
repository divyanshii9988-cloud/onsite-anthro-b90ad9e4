import { Building2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export function Header() {
  const { user, selectedCorporate, assignedCorporates, selectCorporate } = useAuth();
  
  // Admin doesn't need to select corporate, they see everything
  // For staff with only one corporate, it's auto-selected
  const showCorporateSelector = user?.role !== 'admin' && assignedCorporates.length > 0;

  if (!showCorporateSelector && user?.role === 'admin') {
    return null; // Admin doesn't need a header with corporate selector
  }

  return (
    <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Building2 className="w-5 h-5 text-muted-foreground" />
        {showCorporateSelector ? (
          <Select 
            value={selectedCorporate?.id || ''} 
            onValueChange={selectCorporate}
          >
            <SelectTrigger className="w-[280px] border-0 bg-transparent hover:bg-muted/50 focus:ring-0">
              <SelectValue placeholder="Select Corporate" />
            </SelectTrigger>
            <SelectContent>
              {assignedCorporates.map((corp) => (
                <SelectItem key={corp.id} value={corp.id}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{corp.name}</span>
                    <span className="text-xs text-muted-foreground">{corp.location}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div>
            <p className="font-medium text-sm">{selectedCorporate?.name || 'No Corporate Assigned'}</p>
            <p className="text-xs text-muted-foreground">{selectedCorporate?.location}</p>
          </div>
        )}
      </div>
      
      {!selectedCorporate && user?.role !== 'admin' && (
        <div className="text-sm text-warning flex items-center gap-2">
          <span className="animate-pulse">⚠️</span>
          Please select a corporate to view data
        </div>
      )}
    </header>
  );
}
