import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { apiKeyService } from '@/services/apiKeyService';
import { useApp } from '@/contexts/AppContext';
interface TestResult {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  responseTime: number;
}
export const ApiKeyTestTool: React.FC = () => {
  const { config } = useApp();
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('/api/external/products');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const commonEndpoints = [{
    path: '/api/external/products',
    description: 'List products'
  }, {
    path: '/api/external/products/alerts/low-stock',
    description: 'Low stock alerts'
  }, {
    path: '/api/external/analytics/overview',
    description: 'Analytics overview'
  }, {
    path: '/api/external/analytics/categories',
    description: 'Category analysis'
  }];
  const testApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }
    setTesting(true);
    setResult(null);
    const startTime = Date.now();
    try {
      const fullUrl = `${config.baseURL}${endpoint}`;
      const response = await fetch(fullUrl, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      setResult({
        success: response.ok,
        status: response.status,
        data: data,
        responseTime
      });
      if (response.ok) {
        toast.success(`API test successful (${responseTime}ms)`);
      } else {
        toast.error(`API test failed: ${response.status}`);
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      setResult({
        success: false,
        status: 0,
        error: error.message,
        responseTime
      });
      toast.error(`API test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };
  return <div className="space-y-6">
      <Card>
        
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input id="apiKey" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk_live_your_api_key_here" />
          </div>

          <div>
            <Label htmlFor="endpoint">Test Endpoint</Label>
            <Input id="endpoint" value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="/api/external/products" />
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground">Quick select:</p>
              <div className="flex flex-wrap gap-1">
                {commonEndpoints.map(ep => <Button key={ep.path} variant="outline" size="sm" className="text-xs" onClick={() => setEndpoint(ep.path)}>
                    {ep.description}
                  </Button>)}
              </div>
            </div>
          </div>

          <Button onClick={testApiKey} disabled={testing} className="w-full">
            {testing ? <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </> : <>
                <Play className="w-4 h-4 mr-2" />
                Test API Key
              </>}
          </Button>
        </CardContent>
      </Card>

      {result && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
              Test Result
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant={result.success ? "default" : "destructive"}>
                Status: {result.status}
              </Badge>
              <Badge variant="outline">
                {result.responseTime}ms
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {result.success ? <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  API key is working correctly. Response received in {result.responseTime}ms.
                </AlertDescription>
              </Alert> : <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {result.error || `API request failed with status ${result.status}`}
                </AlertDescription>
              </Alert>}

            <div className="mt-4">
              <Label>Response Data:</Label>
              <Textarea value={JSON.stringify(result.data || result.error, null, 2)} readOnly className="mt-2 font-mono text-sm" rows={10} />
            </div>
          </CardContent>
        </Card>}
    </div>;
};