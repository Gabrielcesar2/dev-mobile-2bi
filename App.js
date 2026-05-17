import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  LogBox,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// controla a barrinha de status lá em cima (hora, bateria, etc)
import { StatusBar } from "expo-status-bar";

// ícones prontos — usei o "add" no botão flutuante
import { MaterialIcons } from "@expo/vector-icons";

// o checkbox nativo do expo com suporte a cor personalizada
import Checkbox from "expo-checkbox";

// seletor de emojis
import EmojiPicker from "react-native-emoji-chooser";

import { useState } from "react";

LogBox.ignoreLogs(["VirtualizedLists should never be nested"]);


// =====================================================
// FUNÇÃO DE FORMATAÇÃO DE DATA
// =====================================================

// recebe um timestamp (número) e transforma numa string bonita em pt-BR
// ex: 1747000000000 → "07 de maio de 2026"
// a gente usa o id da tarefa como timestamp (Date.now()), então não precisa
// guardar um campo "createdAt" separado — o id já serve pra isso
function formatarData(timestamp) {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// =====================================================
// COMPONENTE DE CARD DE TAREFA
// =====================================================

// componente separado pra não poluir o App principal
// recebe a tarefa (task) e uma função de toggle (onToggle)
// quando o checkbox muda, chama onToggle passando o id da tarefa
function TaskItem({ task, onToggle }) {
  return (
    <View style={styles.taskCard}>
      {/* o checkbox — quando marcado fica roxo (#515CC6) */}
      <Checkbox
        value={task.done}
        onValueChange={() => onToggle(task.id)}
        color={task.done ? "#515CC6" : undefined}
        style={styles.checkbox}
      />

      <View style={styles.taskInfo}>
        {/* emoji só aparece se a tarefa NÃO estiver concluída */}
        {!task.done && (
          <Text style={styles.taskEmoji}>{task.emoji}</Text>
        )}

        <View style={{ flex: 1 }}>
          {/* nome da tarefa — se estiver done, fica riscado e cinza */}
          <Text style={[styles.taskText, task.done && styles.taskDone]}>
            {task.text}
          </Text>

          {/* categoria só aparece se a tarefa NÃO estiver concluída */}
          {!task.done && (
            <Text style={styles.taskCategory}>{task.category}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

// =====================================================
// COMPONENTE PRINCIPAL — App
// =====================================================

export default function App() {
  // timestamp do momento atual — usado pra mostrar a data de hoje no header
  const hoje = Date.now();

  // ---- ESTADO DAS TAREFAS ----
  // 3 tarefas de exemplo pra não ficar vazio
  // cada tarefa tem: id (timestamp), texto, emoji, categoria e done (boolean)
  const [tasks, setTasks] = useState([
    { id: 1, text: "Estudar React Native", emoji: "📚", category: "Estudos", done: false },
    { id: 2, text: "Fazer exercícios", emoji: "🏃", category: "Saúde", done: false },
    { id: 3, text: "Comprar mantimentos", emoji: "🛒", category: "Casa", done: true },
  ]);

  // ESTADOS DO MODAL
  const [modalVisivel, setModalVisivel] = useState(false);   // abre/fecha o modal
  const [novaTarefa, setNovaTarefa] = useState("");          // texto do input de tarefa
  const [categoria, setCategoria] = useState("");            // texto do input de categoria
  const [selectedEmoji, setSelectedEmoji] = useState("😀"); // emoji escolhido (começa com 😀)
  const [emojiPickerAberto, setEmojiPickerAberto] = useState(false); // mostra/esconde o picker

  // SEPARANDO AS TAREFAS EM DUAS LISTA
  // filter retorna um novo array só com os itens que passam na condição
  const incompletas = tasks.filter((t) => !t.done);
  const completas = tasks.filter((t) => t.done);

  // FUNÇÃO PARA FECHAR O MODAL
  // a gente cria uma função separada porque precisa sempre:
  // 1. dispensar o teclado ANTES de fechar (evita bug de layout no Android)
  // 2. fechar o modal
  // 3. fechar o emoji picker também
  function fecharModal() {
    Keyboard.dismiss();
    setModalVisivel(false);
    setEmojiPickerAberto(false);
  }

  // FUNÇÃO PARA MARCAR/DESMARCAR TAREFA
  // percorre todas as tarefas e inverte o "done" só da que tem o id passado
  // as outras ficam iguais — o spread (...t) copia tudo e só muda o done
  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  // FUNÇÃO PARA ADICIONAR NOVA TAREFA
  function adicionarTarefa() {
    // guard clause — não faz nada se o campo de tarefa estiver vazio
    if (!novaTarefa.trim()) return;

    // adiciona a nova tarefa no final do array (spread + novo objeto)
    // Date.now() como id garante que cada tarefa tem um número único
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: novaTarefa.trim(),
        category: categoria.trim() || "Geral", // se não digitou categoria, usa "Geral"
        emoji: selectedEmoji,
        done: false, // toda tarefa nova começa como não concluída
      },
    ]);

    // reseta tudo depois de adicionar
    setNovaTarefa("");
    setCategoria("");
    setSelectedEmoji("😀");
    setEmojiPickerAberto(false);
    setModalVisivel(false);
  }

  // =====================================================
  // RENDERIZAÇÃO (o que aparece na tela)
  // =====================================================
  return (
    <View style={styles.container}>
      {/* controla os ícones da status bar — "dark" = ícones pretos (fundo claro) */}
      <StatusBar style="dark" />

      {/* ---- HEADER ---- */}
      <View style={styles.header}>
        {/* data de hoje formatada */}
        <Text style={styles.dataTexto}>{formatarData(hoje)}</Text>

        {/* badges de contagem — dinâmicos, atualizam automaticamente */}
        <View style={styles.contadores}>
          <View style={styles.badge}>
            <Text style={styles.badgeNum}>{incompletas.length}</Text>
            <Text style={styles.badgeLabel}>pendentes</Text>
          </View>
          <View style={[styles.badge, styles.badgeDone]}>
            <Text style={[styles.badgeNum, styles.badgeNumDone]}>{completas.length}</Text>
            <Text style={[styles.badgeLabel, styles.badgeLabelDone]}>realizadas</Text>
          </View>
        </View>
      </View>

      {/* ---- LISTA DE TAREFAS ---- */}
      {/* usei FlatList só pelo scroll — os itens ficam no ListHeaderComponent */}
      {/* isso é necessário porque não pode ter dois FlatList aninhados */}
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            {/* SEÇÃO: PENDENTES */}
            <Text style={styles.secao}>📋 Pendentes</Text>
            {incompletas.length === 0 ? (
              <Text style={styles.vazio}>Nenhuma tarefa pendente 🎉</Text>
            ) : (
              // mapeia cada tarefa incompleta num componente TaskItem
              incompletas.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={toggleTask} />
              ))
            )}

            {/* SEÇÃO: REALIZADAS */}
            <Text style={[styles.secao, { marginTop: 24 }]}>✅ Realizadas</Text>
            {completas.length === 0 ? (
              <Text style={styles.vazio}>Nenhuma tarefa concluída ainda</Text>
            ) : (
              completas.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={toggleTask} />
              ))
            )}
          </>
        }
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        keyExtractor={() => "header"}
      />

      {/* ---- BOTÃO FLUTUANTE (FAB) ---- */}
      {/* position: absolute faz ele flutuar sobre o resto da tela */}
      {/* o ícone "add" é o + do Material Icons */}
      <Pressable style={styles.fab} onPress={() => setModalVisivel(true)}>
        <MaterialIcons name="add" size={38} color="#fff" />
      </Pressable>

      {/* ---- MODAL ---- */}
      {/* transparent={true} permite o fundo escuro semitransparente */}
      {/* animationType="slide" faz o modal subir de baixo pra cima */}
      <Modal
        visible={modalVisivel}
        animationType="slide"
        transparent={true}
        onRequestClose={fecharModal} // botão voltar do Android
      >
        {/* KeyboardAvoidingView empurra o conteúdo pra cima quando o teclado abre */}
        {/* behavior muda entre iOS e Android pq eles se comportam diferente */}
        {/* flex: 1 é OBRIGATÓRIO — sem isso tem bug feio no Android */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          {/* o Pressable externo é o fundo escuro — tocar nele fecha o modal */}
          <Pressable style={styles.modalOverlay} onPress={fecharModal}>

            {/* o Pressable interno é o card branco — o stopPropagation impede */}
            {/* que toques dentro do card cheguem até o overlay e fechem o modal */}
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.modalTitulo}>Nova Tarefa</Text>

              {/* flexShrink: 1 faz o form encolher quando o picker abre */}
              {/* assim o botão Criar nunca some da tela */}
              <View style={styles.modalForm}>

                {/* campo do nome da tarefa */}
                <TextInput
                  style={styles.input}
                  placeholder="Nome da tarefa"
                  placeholderTextColor="#aaa"
                  value={novaTarefa}
                  onChangeText={setNovaTarefa}
                />

                {/* linha com emoji + categoria lado a lado */}
                <View style={{ flexDirection: "row", gap: 10 }}>

                  {/* coluna do emoji — largura fixa de 60 */}
                  <View style={styles.emojiCol}>
                    {/* tocar aqui abre/fecha o picker (toggle) */}
                    <Pressable
                      style={styles.emojiBotao}
                      onPress={() => setEmojiPickerAberto((p) => !p)}
                    >
                      <Text style={{ fontSize: 28 }}>{selectedEmoji}</Text>
                    </Pressable>
                  </View>

                  {/* coluna da categoria — flex: 1 ocupa o resto da linha */}
                  <View style={styles.categoriaCol}>
                    <TextInput
                      style={[styles.input, { marginTop: 0, flex: 1 }]}
                      placeholder="Categoria"
                      placeholderTextColor="#aaa"
                      value={categoria}
                      onChangeText={setCategoria}
                    />
                  </View>
                </View>

                {/* o picker só renderiza quando emojiPickerAberto === true */}
                {/* o View com height: 180 FIXO é obrigatório — sem ele o scroll */}
                {/* interno do picker não funciona e o botão Criar some da tela */}
                {emojiPickerAberto && (
                  <View style={styles.emojiPickerWrapper}>
                    <EmojiPicker
                      onSelect={(emoji) => {
                        setSelectedEmoji(emoji);       // salva o emoji escolhido
                        setEmojiPickerAberto(false);   // fecha o picker automaticamente
                      }}
                      mode="light"
                      lang="en"
                      columnCount={8}
                    />
                  </View>
                )}
              </View>

              {/* flexShrink: 0 garante que esse botão NUNCA some da tela */}
              {/* mesmo quando o picker abre e o form encolhe */}
              <Pressable style={styles.btnCriar} onPress={adicionarTarefa}>
                <Text style={styles.btnCriarTexto}>Criar</Text>
              </Pressable>

            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// =====================================================
// ESTILOS
// =====================================================
const styles = StyleSheet.create({
  // container principal — ocupa a tela toda
  container: {
    flex: 1,
    backgroundColor: "#F4F5FB",
  },

  // header branco no topo com a data e os badges
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB",
  },
  dataTexto: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 12,
  },
  contadores: {
    flexDirection: "row",
    gap: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF0FD",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgeDone: {
    backgroundColor: "#E8F5E9", // verde clarinho pras realizadas
  },
  badgeNum: {
    fontSize: 15,
    fontWeight: "700",
    color: "#515CC6",
  },
  badgeNumDone: {
    color: "#388E3C",
  },
  badgeLabel: {
    fontSize: 13,
    color: "#515CC6",
  },
  badgeLabelDone: {
    color: "#388E3C",
  },

  // área de scroll das tarefas
  lista: {
    padding: 20,
    paddingBottom: 120, // espaço extra pra o FAB não cobrir a última tarefa
  },
  secao: {
    fontSize: 15,
    fontWeight: "700",
    color: "#888",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  vazio: {
    fontSize: 14,
    color: "#BCBCBC",
    fontStyle: "italic",
    marginBottom: 8,
  },

  // card de cada tarefa
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#515CC6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  checkbox: {
    marginRight: 14,
    borderRadius: 6,
  },
  taskInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  taskEmoji: {
    fontSize: 26,
  },
  taskText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  taskDone: {
    textDecorationLine: "line-through",
    color: "#BCBCBC", // cinza quando concluída
  },
  taskCategory: {
    fontSize: 12,
    color: "#515CC6",
    marginTop: 2,
    fontWeight: "500",
  },

  // FAB — o botão flutuante roxo com o +
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#515CC6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#515CC6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  // fundo escuro semitransparente do modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  // card branco que sobe de baixo
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 18,
    textAlign: "center",
  },
  modalForm: {
    flexShrink: 1, // encolhe quando o picker abre, mantendo o botão visível
    gap: 12,
  },
  input: {
    backgroundColor: "#F4F5FB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A1A2E",
  },
  emojiCol: {
    width: 60,
  },
  emojiBotao: {
    width: 60,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#F4F5FB",
    alignItems: "center",
    justifyContent: "center",
  },
  categoriaCol: {
    flex: 1, // ocupa todo o espaço que sobrou depois do emoji
  },
  emojiPickerWrapper: {
    height: 180,   // altura FIXA — sem isso o scroll interno não funciona
    overflow: "hidden",
    borderRadius: 12,
  },
  btnCriar: {
    flexShrink: 0, // nunca encolhe, sempre visível
    backgroundColor: "#515CC6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  btnCriarTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});