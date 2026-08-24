import { useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import TarefaItem from "../components/TarefaItem";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Chave usada para identificar onde as tarefas serão salvas no AsyncStorage.
// É como se fosse o "nome" do espaço onde vamos guardar os dados.
const CHAVE_STORAGE = "@rn-storage-lesson:tarefas";

export default function ListaTarefasScreen() {
  const [tarefas, setTarefas] = useState([]);
  const [textoInput, setTextoInput] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    // Função responsável por buscar as tarefas que foram salvas anteriormente no AsyncStorage.
    async function carregarTarefas() {
      try {
        const tarefasSalvas = await AsyncStorage.getItem(CHAVE_STORAGE);

        // Se tarefasSalvas for diferente de null, significa que encontramos tarefas salvas.
        if (tarefasSalvas !== null) {
          // Os dados do AsyncStorage são armazenados como texto (string). JSON.parse transforma esse texto novamente em um array de objetos.
          setTarefas(JSON.parse(tarefasSalvas));
        }
      } catch (erro) {
        // Caso aconteça algum erro durante o carregamento, mostramos o erro no console para facilitar a identificação do problema.
        console.error("Erro ao carregar tarefas do Storage:", erro);
      } finally {
        // Independentemente de ter dado certo ou errado, avisamos que o carregamento terminou.
        setCarregando(false);
      }
    }
    carregarTarefas();
    // [] significa que esse useEffect será executado apenas uma vez, quando a tela/componente for carregado.
  }, []);

  useEffect(() => {
    // Enquanto ainda estamos carregando as tarefas antigas, não devemos salvar nada.
    // Isso evita que o array vazio inicial sobrescreva as tarefas que ainda estão sendo carregadas.
    if (carregando) return;

    // Salva as tarefas atuais no AsyncStorage.
    // JSON.stringify transforma o array de objetos em texto, porque o AsyncStorage armazena os dados como string.
    AsyncStorage.setItem(CHAVE_STORAGE, JSON.stringify(tarefas)).catch(
      (erro) => {
        console.error("Erro ao salvar tarefas no Storage:", erro);
      },
    );
    // Sempre que adicionarmos, editarmos, concluirmos ou excluirmos uma tarefa, ela será salva novamente.
  }, [tarefas, carregando]);

  function adicionarTarefa() {
    const texto = textoInput.trim();

    // Se o usuário não digitou nada, a função para aqui.
    if (texto === "") return;

    const novaTarefa = {
      id: Date.now().toString(),
      texto,
      concluida: false,
    };

    // Adicionamos a nova tarefa ao final da lista.
    // tarefasAtuais representa o estado atual da lista.
    // [...tarefasAtuais, novaTarefa] cria um NOVO array
    // contendo as tarefas antigas + a nova tarefa.
    setTarefas((tarefasAtuais) => [...tarefasAtuais, novaTarefa]);
    // Depois de adicionar a tarefa, limpamos o campo de texto.
    setTextoInput("");
  }

  // Procuramos na lista a tarefa que possui o ID recebido.
  function editarTarefa(id) {
    // O find() percorre as tarefas e retorna a primeira que atender à condição.
    const tarefa = tarefas.find((tarefa) => tarefa.id === id);

    if (tarefa) {
      // Colocamos o texto da tarefa no campo de texto.
      // Assim, o usuário consegue visualizar e modificar o texto que já estava salvo.
      setTextoInput(tarefa.texto);

      // Guardamos o ID da tarefa que está sendo editada.
      // Isso é importante para sabermos QUAL tarefa devemos alterar quando o usuário clicar em "Salvar".
      setEditando(id);
    }
  }

  function salvarEdicao() {
    const texto = textoInput.trim();

    if (texto === "") return;

    // Percorremos todas as tarefas usando map(). O map() cria um NOVO array com as tarefas atualizadas.
    setTarefas((tarefasAtuais) =>
      tarefasAtuais.map(
        (tarefa) =>
          // Verificamos se o ID da tarefa atual é igual ao ID que está guardado em "editando".
          tarefa.id === editando ? { ...tarefa, texto } : tarefa,
        // {...tarefa} mantém todas as informações antigas
        // e "texto" substitui apenas o texto antigo.
        // Se não for a tarefa que estamos editando, mantemos ela exatamente como estava.
      ),
    );

    // Depois de salvar a alteração, limpamos o campo.
    setTextoInput("");
    // Como a edição terminou, voltamos para null.
    setEditando(null);
  }

  function alternarConcluida(id) {
    setTarefas(
      (tarefasAtuais) =>
        tarefasAtuais.map((tarefa) =>
          // Procuramos a tarefa que possui o ID recebido.
          tarefa.id === id
            ? { ...tarefa, concluida: !tarefa.concluida }
            : tarefa,
        ),
      // {...tarefa} mantém todas as informações dela.
      // !tarefa.concluida inverte o valor:
      // false → true
      // true → false
      // Dessa forma, podemos marcar e desmarcar a tarefa.
    );
  }

  function excluirTarefa(id) {
    setTarefas((tarefasAtuais) =>
      // O filter() cria um novo array contendo apenas as tarefas que atendem à condição.
      tarefasAtuais.filter((tarefa) => tarefa.id !== id),
      // Mantemos todas as tarefas cujo ID seja DIFERENTE do ID recebido.
      // A tarefa que possui o ID recebido não passa pelo filtro, então ela é removida da lista.
    );
  }

  function limparTarefas() {
    // Limpar TODAS as tarefas da lista, deixando o array vazio.
    setTarefas([]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.titulo}>Lista de Tarefas</Text>

      <View style={styles.formulario}>
        <TextInput
          style={styles.input}
          placeholder="Digite uma nova tarefa..."
          value={textoInput}
          onChangeText={setTextoInput}
          onSubmitEditing={adicionarTarefa}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.botaoAdicionar}
          onPress={editando ? salvarEdicao : adicionarTarefa}
        >
          <Text style={styles.textoBotaoAdicionar}>
            {editando ? "Salvar" : "Adicionar"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.botaoLimpar} onPress={limparTarefas}>
        <Text style={styles.textoBotaoLimpar}>Limpar todas as tarefas</Text>
      </TouchableOpacity>

      <FlatList
        data={tarefas}
        keyExtractor={(tarefa) => tarefa.id}
        renderItem={({ item }) => (
          <TarefaItem
            tarefa={item}
            aoAlternarConcluida={alternarConcluida}
            aoExcluir={excluirTarefa}
            aoEditar={editarTarefa}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.listaVazia}>
            Nenhuma tarefa cadastrada ainda.
          </Text>
        }
        contentContainerStyle={styles.listaConteudo}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  formulario: {
    flexDirection: "row",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  botaoAdicionar: {
    backgroundColor: "#2e86de",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  textoBotaoAdicionar: {
    color: "#fff",
    fontWeight: "bold",
  },
  botaoLimpar: {
    backgroundColor: "#e74c3c",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  textoBotaoLimpar: {
    color: "#fff",
    fontWeight: "bold",
  },
  listaConteudo: {
    paddingBottom: 20,
  },
  listaVazia: {
    textAlign: "center",
    color: "#888",
    marginTop: 24,
  },
});
