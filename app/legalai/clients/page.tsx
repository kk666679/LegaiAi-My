'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Plus, Briefcase, ChevronRight } from 'lucide-react';

const CLIENTS = [
  { id: '1', name: 'ABC Holdings Sdn Bhd', type: 'Corporate', matters: 3, conflicts: false, risk: 'medium' },
  { id: '2', name: 'TechStart Sdn Bhd', type: 'Corporate', matters: 1, conflicts: false, risk: 'low' },
  { id: '3', name: 'Green Valley Sdn Bhd', type: 'Corporate', matters: 2, conflicts: false, risk: 'low' },
  { id: '4', name: 'DataShield Technologies', type: 'Corporate', matters: 1, conflicts: false, risk: 'medium' },
];

export default function ClientsPage() {
  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">Client registry and relationship management</p>
        </div>
        <Button asChild className="gap-2"><Link href="/request-access"><Plus className="size-4" /> Add Client</Link></Button>
      </div>

      <div className="space-y-3">
        {CLIENTS.map((client) => (
          <Link key={client.id} href={`/legalai/clients/${client.id}`}>
            <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{client.name[0]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><h3 className="font-semibold">{client.name}</h3><Badge variant="outline" className="text-[10px]">{client.type}</Badge></div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Briefcase className="size-3" /> {client.matters} matters</span>
                    {client.conflicts && <Badge variant="destructive" className="text-[10px]">Conflict</Badge>}
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
