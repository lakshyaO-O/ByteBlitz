'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { initializeFirebase } from '@/firebase';
import {
  collection, query, orderBy, limit, getDocs, doc, getDoc, updateDoc,
} from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase/provider';
import { cn } from '@/lib/utils';
import {
  Shield, Mail, Smartphone, History, LogOut, AlertTriangle,
  CheckCircle, XCircle, Loader2, Clock, Monitor, Globe, Send,
} from 'lucide-react';
import { LoginHistoryEntry } from '@/app/lib/types';

export function SecuritySettings() {
  const { user } = useUser();
  const auth = useAuth();
  const [sendingVerification, setSendingVerification] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db || !user) { setLoadingHistory(false); return; }

      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) setProfileData(userSnap.data());

      const historySnap = await getDocs(
        query(collection(db, 'users', user.uid, 'loginHistory'), orderBy('timestamp', 'desc'), limit(20))
      );
      setLoginHistory(historySnap.docs.map(d => ({ id: d.id, ...d.data() }) as LoginHistoryEntry));

      const sessionsSnap = await getDocs(
        query(collection(db, 'users', user.uid, 'sessions'), orderBy('lastActive', 'desc'), limit(10))
      );
      setSessions(sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      setLoadingHistory(false);
    } catch { setLoadingHistory(false); }
  };

  const handleSendVerification = async () => {
    if (!auth?.currentUser || sendingVerification) return;
    setSendingVerification(true);
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (e) { console.warn('[Security] Send verification failed:', e); }
    setSendingVerification(false);
  };

  const formatDate = (timestamp: string | any) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) return timestamp.toDate().toLocaleString();
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.emailVerified ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <div>
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.emailVerified ? 'Verified' : 'Not verified'}
                </p>
              </div>
            </div>
            {!user?.emailVerified && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendVerification}
                disabled={sendingVerification}
                className="gap-2"
              >
                {sendingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Resend Verification
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Login History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
          ) : loginHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No login history recorded yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginHistory.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs">{formatDate(entry.timestamp)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">{entry.method}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.device || 'Unknown'}</TableCell>
                    <TableCell>
                      {entry.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No active sessions</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{session.device || 'Unknown device'}</p>
                      <p className="text-xs text-muted-foreground">Last active: {formatDate(session.lastActive)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">{session.status || 'active'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
