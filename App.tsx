import { StatusBar } from 'expo-status-bar';
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { guardarCompartido } from './src/capture';
import { TIPOS, type Tipo } from './src/classify';
import { borrar, cambiarTipo, type Elemento, listar, marcarVisto, olvidados } from './src/db';

const ORIGEN_ETIQUETA: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X',
  facebook: 'Facebook',
  pinterest: 'Pinterest',
  web: 'Web',
  texto: 'Nota',
};

function Inicio() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntentContext();
  const [filtro, setFiltro] = useState<Tipo | null>(null);
  const [version, setVersion] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [nuevoEnlace, setNuevoEnlace] = useState('');

  const refrescar = useCallback(() => setVersion((v) => v + 1), []);
  const elementos = useMemo(() => listar(filtro), [filtro, version]);
  const recordatorios = useMemo(() => olvidados(3), [version]);

  const avisar = (texto: string) => {
    setAviso(texto);
    setTimeout(() => setAviso(null), 2500);
  };

  // Lo que llega desde el menú Compartir de otra app.
  useEffect(() => {
    if (!hasShareIntent) return;
    guardarCompartido(shareIntent, refrescar).then((r) => {
      if (r.estado === 'guardado') avisar('Guardado en GuardApp');
      if (r.estado === 'duplicado') avisar('Ya lo tenías guardado');
      refrescar();
      resetShareIntent();
    });
  }, [hasShareIntent]);

  useEffect(() => {
    if (error) avisar(`Error al recibir: ${error}`);
  }, [error]);

  const guardarManual = async () => {
    if (!nuevoEnlace.trim()) return;
    const r = await guardarCompartido({ text: nuevoEnlace, webUrl: null, meta: null }, refrescar);
    setNuevoEnlace('');
    avisar(r.estado === 'duplicado' ? 'Ya lo tenías guardado' : 'Guardado');
    refrescar();
  };

  const abrir = (e: Elemento) => {
    marcarVisto(e.id);
    refrescar();
    if (e.url) Linking.openURL(e.url);
  };

  const opciones = (e: Elemento) => {
    Alert.alert(e.titulo ?? e.url ?? 'Elemento', 'Cambiar categoría o borrar', [
      ...TIPOS.filter((t) => t.id !== e.tipo)
        .slice(0, 6)
        .map((t) => ({
          text: `${t.emoji} ${t.nombre}`,
          onPress: () => {
            cambiarTipo(e.id, t.id);
            refrescar();
          },
        })),
      {
        text: 'Borrar',
        style: 'destructive' as const,
        onPress: () => {
          borrar(e.id);
          refrescar();
        },
      },
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

  return (
    <SafeAreaView style={s.pantalla}>
      <StatusBar style="dark" />
      <Text style={s.titulo}>GuardApp</Text>

      <View style={s.fila}>
        <TextInput
          style={s.input}
          placeholder="Pega un enlace o una nota"
          value={nuevoEnlace}
          onChangeText={setNuevoEnlace}
          onSubmitEditing={guardarManual}
          autoCapitalize="none"
        />
        <Pressable style={s.boton} onPress={guardarManual}>
          <Text style={s.botonTexto}>Guardar</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtros}>
        <Chip activo={filtro === null} onPress={() => setFiltro(null)} texto="Todo" />
        {TIPOS.map((t) => (
          <Chip
            key={t.id}
            activo={filtro === t.id}
            onPress={() => setFiltro(t.id)}
            texto={`${t.emoji} ${t.nombre}`}
          />
        ))}
      </ScrollView>

      <FlatList
        data={elementos}
        keyExtractor={(e) => String(e.id)}
        ListHeaderComponent={
          recordatorios.length > 0 && filtro === null ? (
            <View style={s.recordatorio}>
              <Text style={s.recordatorioTitulo}>¿Te acuerdas de esto?</Text>
              {recordatorios.map((e) => (
                <Pressable key={e.id} onPress={() => abrir(e)}>
                  <Text style={s.recordatorioItem} numberOfLines={1}>
                    {TIPOS.find((t) => t.id === e.tipo)?.emoji} {e.titulo ?? e.url ?? e.texto}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <Text style={s.vacio}>
            Aún no hay nada. En Instagram, TikTok o el navegador pulsa Compartir y elige GuardApp.
          </Text>
        }
        renderItem={({ item: e }) => (
          <Pressable style={s.tarjeta} onPress={() => abrir(e)} onLongPress={() => opciones(e)}>
            {e.imagen ? <Image source={{ uri: e.imagen }} style={s.miniatura} /> : <View style={[s.miniatura, s.sinImagen]} />}
            <View style={{ flex: 1 }}>
              <Text style={s.tarjetaTitulo} numberOfLines={2}>
                {e.titulo ?? e.texto ?? e.url}
              </Text>
              {e.descripcion ? (
                <Text style={s.tarjetaDesc} numberOfLines={2}>
                  {e.descripcion}
                </Text>
              ) : null}
              <Text style={s.tarjetaMeta}>
                {TIPOS.find((t) => t.id === e.tipo)?.emoji} {TIPOS.find((t) => t.id === e.tipo)?.nombre} ·{' '}
                {ORIGEN_ETIQUETA[e.origen]} · {new Date(e.creado).toLocaleDateString('es-ES')}
                {e.visto ? '' : ' · sin ver'}
              </Text>
            </View>
          </Pressable>
        )}
      />

      {aviso ? (
        <View style={s.aviso}>
          <Text style={s.avisoTexto}>{aviso}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function Chip({ texto, activo, onPress }: { texto: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, activo && s.chipActivo]}>
      <Text style={[s.chipTexto, activo && s.chipTextoActivo]}>{texto}</Text>
    </Pressable>
  );
}

export default function App() {
  return (
    <ShareIntentProvider>
      <Inicio />
    </ShareIntentProvider>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#F7F6F3', paddingTop: 12 },
  titulo: { fontSize: 28, fontWeight: '700', paddingHorizontal: 16, marginBottom: 8 },
  fila: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E3E1DC' },
  boton: { backgroundColor: '#1F1F1F', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  botonTexto: { color: '#fff', fontWeight: '600' },
  filtros: { flexGrow: 0, paddingHorizontal: 12, marginVertical: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#fff', marginHorizontal: 4, borderWidth: 1, borderColor: '#E3E1DC' },
  chipActivo: { backgroundColor: '#1F1F1F', borderColor: '#1F1F1F' },
  chipTexto: { color: '#333' },
  chipTextoActivo: { color: '#fff' },
  recordatorio: { backgroundColor: '#FFF4D6', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 12 },
  recordatorioTitulo: { fontWeight: '700', marginBottom: 6 },
  recordatorioItem: { paddingVertical: 4, color: '#5A4500' },
  vacio: { textAlign: 'center', color: '#777', padding: 32 },
  tarjeta: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 10 },
  miniatura: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#EEE' },
  sinImagen: { backgroundColor: '#E9E7E2' },
  tarjetaTitulo: { fontWeight: '600', fontSize: 15 },
  tarjetaDesc: { color: '#555', marginTop: 2, fontSize: 13 },
  tarjetaMeta: { color: '#888', marginTop: 4, fontSize: 12 },
  aviso: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#1F1F1F', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  avisoTexto: { color: '#fff' },
});
