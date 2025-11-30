"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowLeft, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmailRenderer } from "@/components/email/EmailRenderer";

interface AlertDetail {
  id: number;
  subject: string;
  from_email: string;
  to_email: string;
  received_at: string;
  body_html?: string;
  body_text?: string;
  starred: boolean;
}

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const res = await fetch(`/api/alerts/${params.id}`);
        const data = await res.json();
        if (data.alert) {
          setAlert(data.alert);
        }
      } catch (error) {
        console.error("Failed to fetch alert details", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAlert();
    }
  }, [params.id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!alert) return <div className="p-8 text-center">Alert not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold truncate flex-1">{alert.subject}</h1>
        <Button variant="ghost" size="icon">
          <Star className={cn("h-4 w-4", alert.starred && "fill-current")} />
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">{alert.from_email}</p>
              <p className="text-sm text-muted-foreground">
                To: {alert.to_email}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(alert.received_at).toLocaleString()}
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <EmailRenderer
            bodyHtml={alert.body_html}
            bodyText={alert.body_text}
          />
        </CardContent>
      </Card>
    </div>
  );
}
