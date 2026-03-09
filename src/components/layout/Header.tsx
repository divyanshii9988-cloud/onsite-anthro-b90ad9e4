import { useState } from 'react';
import { Building2, ChevronsUpDown, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, selectedCorporate, assignedCorporates, selectCorporate, corporates } = useAuth();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const showCorporateSelector = isAdmin || assignedCorporates.length > 1;
  const displayList = isAdmin ? corporates : assignedCorporates;

  const handleSelect = (value: string) => {
    if (value === 'all') {
      selectCorporate('');
    } else {
      selectCorporate(value);
    }
    setOpen(false);
  };

  const displayLabel = selectedCorporate
    ? selectedCorporate.name
    : isAdmin
    ? 'All Corporates'
    : 'Select Corporate';

  const displaySub = selectedCorporate
    ? selectedCorporate.location
    : isAdmin
    ? 'View data across all locations'
    : '';

  return (
    <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Building2 className="w-5 h-5 text-muted-foreground" />
        {showCorporateSelector ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                role="combobox"
                aria-expanded={open}
                className="w-[280px] justify-between hover:bg-muted/50 px-3 h-9"
              >
                <div className="flex flex-col items-start text-left min-w-0">
                  <span className="font-medium text-sm truncate">{displayLabel}</span>
                  {displaySub && (
                    <span className="text-xs text-muted-foreground truncate">{displaySub}</span>
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search corporate..." />
                <CommandList>
                  <CommandEmpty>No corporate found.</CommandEmpty>
                  <CommandGroup>
                    {isAdmin && (
                      <CommandItem
                        value="all"
                        onSelect={() => handleSelect('all')}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            !selectedCorporate ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">All Corporates</span>
                          <span className="text-xs text-muted-foreground">View data across all locations</span>
                        </div>
                      </CommandItem>
                    )}
                    {displayList.map((corp) => (
                      <CommandItem
                        key={corp.id}
                        value={`${corp.name} ${corp.location}`}
                        onSelect={() => handleSelect(corp.id)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedCorporate?.id === corp.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">{corp.name}</span>
                          {corp.location && (
                            <span className="text-xs text-muted-foreground">{corp.location}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
