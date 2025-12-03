'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reunionesService } from '@/services/supabaseDataService';
import type { ReunionRepresentante, Alumno, FrecuenciaReuniones, AnalisisSentimiento, TemaInquietud } from '@/types';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Users } from 'lucide-react';

interface ReunionesAnalyticsDashboardProps {
  student?: Alumno | null;
  grado?: string;
}

export default function ReunionesAnalyticsDashboard({
  student,
  grado,
}: ReunionesAnalyticsDashboardProps) {
  const [reuniones, setReuniones] = useState<ReunionRepresentante[]>([]);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaReuniones | null>(null);
  const [temasInquietudes, setTemasInquietudes] = useState<TemaInquietud[]>([]);
  const [analisisSentimientos, setAnalisisSentimientos] = useState<Map<string, AnalisisSentimiento>>(new Map());
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<number>(90);

  useEffect(() => {
    loadData();
  }, [student, grado, periodo]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!reunionesService) {
        console.warn('reunionesService not available');
        setReuniones([]);
        return;
      }
      
      let reunionesData: ReunionRepresentante[];

      if (student) {
        reunionesData = await reunionesService.getByAlumno(student.id_alumno);
        try {
          const frecuenciaData = await reunionesService.getFrecuenciaReuniones(student.id_alumno, periodo);
          setFrecuencia(frecuenciaData);
        } catch (err) {
          console.warn('Error loading frecuencia:', err);
        }

        try {
          const temas = await reunionesService.getTemasInquietudes(student.id_alumno);
          setTemasInquietudes(temas || []);
        } catch (err) {
          console.warn('Error loading temas:', err);
          setTemasInquietudes([]);
        }

        // Load sentiment analysis for each meeting
        const sentimientos = new Map<string, AnalisisSentimiento>();
        for (const reunion of reunionesData || []) {
          if (reunion.inquietudes) {
            try {
              const analisis = await reunionesService.getAnalisisSentimiento(reunion.id_reunion);
              sentimientos.set(reunion.id_reunion, analisis);
            } catch (err) {
              // Skip if analysis fails
              console.warn('Error loading sentiment for reunion:', reunion.id_reunion, err);
            }
          }
        }
        setAnalisisSentimientos(sentimientos);
      } else if (grado) {
        reunionesData = await reunionesService.getByGrado(grado);
      } else {
        reunionesData = await reunionesService.getAll();
      }

      setReuniones(reunionesData || []);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setReuniones([]);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentimiento: string) => {
    switch (sentimiento) {
      case 'Positivo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Negativo':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Neutro':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'Alta':
        return 'bg-red-500';
      case 'Media':
        return 'bg-yellow-500';
      case 'Baja':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTendenciaIcon = (tendencia: string) => {
    if (tendencia.includes('Alta') || tendencia.includes('moderada')) {
      return <TrendingUp className="h-4 w-4 text-orange-600" />;
    } else if (tendencia.includes('Inactivo') || tendencia.includes('Sin reuniones')) {
      return <TrendingDown className="h-4 w-4 text-gray-600" />;
    }
    return <Clock className="h-4 w-4 text-blue-600" />;
  };

  // Calculate statistics
  const stats = {
    totalReuniones: reuniones.length,
    conInquietudes: reuniones.filter(r => r.inquietudes && r.inquietudes.length > 0).length,
    conAcuerdos: reuniones.filter(r => r.acuerdos && r.acuerdos.length > 0).length,
    promedioAsistentes: reuniones.reduce((acc, r) => acc + r.asistentes.length, 0) / (reuniones.length || 1),
    sentimientos: {
      positivo: Array.from(analisisSentimientos.values()).filter(a => a.sentimiento === 'Positivo').length,
      negativo: Array.from(analisisSentimientos.values()).filter(a => a.sentimiento === 'Negativo').length,
      neutro: Array.from(analisisSentimientos.values()).filter(a => a.sentimiento === 'Neutro').length,
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-manglar-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-apple-gray-dark tracking-tight">
          Análisis de Reuniones con Representantes
        </h2>
        {student && (
          <Select value={periodo.toString()} onValueChange={v => setPeriodo(Number(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="60">Últimos 60 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Último año</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-apple-gray">Total Reuniones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-apple-gray-dark">{stats.totalReuniones}</div>
            {student && frecuencia && (
              <div className="flex items-center gap-2 mt-2 text-sm text-apple-gray">
                {getTendenciaIcon(frecuencia.tendencia)}
                <span>{frecuencia.tendencia}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-apple-gray">Con Inquietudes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-apple-gray-dark">{stats.conInquietudes}</div>
            <div className="text-sm text-apple-gray mt-2">
              {stats.totalReuniones > 0
                ? `${Math.round((stats.conInquietudes / stats.totalReuniones) * 100)}% del total`
                : '0%'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-apple-gray">Con Acuerdos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-apple-gray-dark">{stats.conAcuerdos}</div>
            <div className="text-sm text-apple-gray mt-2">
              {stats.totalReuniones > 0
                ? `${Math.round((stats.conAcuerdos / stats.totalReuniones) * 100)}% del total`
                : '0%'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-apple-gray">Promedio Asistentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-apple-gray-dark">
              {stats.promedioAsistentes.toFixed(1)}
            </div>
            <div className="text-sm text-apple-gray mt-2">Por reunión</div>
          </CardContent>
        </Card>
      </div>

      {student && (
        <Tabs defaultValue="frecuencia" className="space-y-4">
          <TabsList>
            <TabsTrigger value="frecuencia">Frecuencia</TabsTrigger>
            <TabsTrigger value="temas">Temas de Inquietudes</TabsTrigger>
            <TabsTrigger value="sentimiento">Análisis de Sentimiento</TabsTrigger>
          </TabsList>

          <TabsContent value="frecuencia" className="space-y-4">
            {frecuencia && (
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Frecuencia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-apple-gray mb-1">Total Reuniones</p>
                      <p className="text-2xl font-bold">{frecuencia.total_reuniones}</p>
                    </div>
                    <div>
                      <p className="text-sm text-apple-gray mb-1">Frecuencia Mensual</p>
                      <p className="text-2xl font-bold">{frecuencia.frecuencia_mensual.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-apple-gray mb-1">Días desde Última Reunión</p>
                      <p className="text-2xl font-bold">{frecuencia.dias_ultima_reunion}</p>
                    </div>
                    <div>
                      <p className="text-sm text-apple-gray mb-1">Tendencia</p>
                      <div className="flex items-center gap-2">
                        {getTendenciaIcon(frecuencia.tendencia)}
                        <p className="text-lg font-semibold">{frecuencia.tendencia}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="temas" className="space-y-4">
            {temasInquietudes.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Temas Más Frecuentes en Inquietudes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {temasInquietudes.map((tema, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-apple-gray-dark">{tema.tema}</p>
                          <p className="text-sm text-apple-gray">
                            Aparece en {tema.frecuencia} reunión{tema.frecuencia !== 1 ? 'es' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-lg font-semibold">
                            {tema.porcentaje.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-apple-gray">
                  No hay datos suficientes para analizar temas de inquietudes
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sentimiento" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Sentimiento en Inquietudes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-800">{stats.sentimientos.positivo}</p>
                    <p className="text-sm text-green-600">Positivo</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">{stats.sentimientos.neutro}</p>
                    <p className="text-sm text-gray-600">Neutro</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-800">{stats.sentimientos.negativo}</p>
                    <p className="text-sm text-red-600">Negativo</p>
                  </div>
                </div>

                {reuniones.filter(r => r.inquietudes).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-apple-gray-dark mb-3">
                      Análisis por Reunión
                    </h4>
                    {reuniones
                      .filter(r => r.inquietudes && analisisSentimientos.has(r.id_reunion))
                      .map(reunion => {
                        const analisis = analisisSentimientos.get(reunion.id_reunion);
                        if (!analisis) return null;

                        return (
                          <div
                            key={reunion.id_reunion}
                            className="p-4 border rounded-lg space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium">
                                {new Date(reunion.fecha).toLocaleDateString('es-ES')}
                              </p>
                              <div className="flex gap-2">
                                <Badge className={getSentimentColor(analisis.sentimiento)}>
                                  {analisis.sentimiento}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <div
                                    className={`w-3 h-3 rounded-full ${getUrgenciaColor(analisis.urgencia)}`}
                                  />
                                  <span className="text-xs text-apple-gray">{analisis.urgencia}</span>
                                </div>
                              </div>
                            </div>
                            {analisis.palabras_clave.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {analisis.palabras_clave.map((palabra, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {palabra}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle>Insights y Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {student && frecuencia && (
            <>
              {frecuencia.tendencia === 'Alta frecuencia' && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-900">Alta Frecuencia de Reuniones</p>
                      <p className="text-sm text-orange-700 mt-1">
                        Este estudiante tiene una alta frecuencia de reuniones. Considere implementar
                        un plan de seguimiento estructurado y evaluar si hay problemas sistémicos que
                        requieran intervención más profunda.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {frecuencia.dias_ultima_reunion > 60 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">Última Reunión Hace {frecuencia.dias_ultima_reunion} Días</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Considere programar una reunión de seguimiento para evaluar el progreso y
                        mantener la comunicación con el representante.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {stats.sentimientos.negativo > stats.sentimientos.positivo && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">Predominio de Sentimiento Negativo</p>
                      <p className="text-sm text-red-700 mt-1">
                        Las inquietudes expresadas tienden a ser negativas. Esto puede indicar la
                        necesidad de intervención adicional o apoyo especializado.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {temasInquietudes.length > 0 && temasInquietudes[0].porcentaje > 50 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-purple-900">
                        Tema Recurrente: {temasInquietudes[0].tema}
                      </p>
                      <p className="text-sm text-purple-700 mt-1">
                        Este tema aparece en el {temasInquietudes[0].porcentaje.toFixed(1)}% de las
                        reuniones. Considere desarrollar estrategias específicas para abordar este
                        tema de manera más efectiva.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {stats.totalReuniones === 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <p className="text-apple-gray">
                No hay suficientes datos para generar insights. Registre más reuniones para obtener
                análisis más detallados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

