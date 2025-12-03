import type { Language } from './translations';

interface TutorialTranslations {
  backToDashboard: Record<Language, string>;
  howToPlay: Record<Language, string>;
  welcomeText: Record<Language, string>;
  objectiveText: Record<Language, string>;
  stepByStepGuide: Record<Language, string>;

  // Steps
  step1Title: Record<Language, string>;
  step1Text: Record<Language, string>;
  step2Title: Record<Language, string>;
  step2Text: Record<Language, string>;
  step3Title: Record<Language, string>;
  step3Text: Record<Language, string>;
  step4Title: Record<Language, string>;
  step4Text: Record<Language, string>;
  step5Title: Record<Language, string>;
  step5Text: Record<Language, string>;
  step6Title: Record<Language, string>;
  step6Text: Record<Language, string>;

  // Video Tutorial
  videoTutorial: Record<Language, string>;
  videoComingSoon: Record<Language, string>;
  waitForUpdates: Record<Language, string>;

  // Game Rules
  gameRules: Record<Language, string>;
  teamSelectionTitle: Record<Language, string>;
  tacticSelectionTitle: Record<Language, string>;
  playerSelectionTitle: Record<Language, string>;
  startingElevenTitle: Record<Language, string>;
  pointsSystemTitle: Record<Language, string>;
  footledgersAuctionsTitle: Record<Language, string>;
  leaguesTitle: Record<Language, string>;

  // FAQ
  faqTitle: Record<Language, string>;
  faq1Question: Record<Language, string>;
  faq1Answer: Record<Language, string>;
  faq2Question: Record<Language, string>;
  faq2Answer: Record<Language, string>;
  faq3Question: Record<Language, string>;
  faq3Answer: Record<Language, string>;
  faq4Question: Record<Language, string>;
  faq4Answer: Record<Language, string>;
  faq5Question: Record<Language, string>;
  faq5Answer: Record<Language, string>;
  faq6Question: Record<Language, string>;
  faq6Answer: Record<Language, string>;
  faq7Question: Record<Language, string>;
  faq7Answer: Record<Language, string>;
  faq8Question: Record<Language, string>;
  faq8Answer: Record<Language, string>;
  faq9Question: Record<Language, string>;
  faq9Answer: Record<Language, string>;

  // Help Section
  needMoreHelp: Record<Language, string>;
  needMoreHelpText: Record<Language, string>;
  support: Record<Language, string>;
}

export const tutorialTranslations: TutorialTranslations = {
  backToDashboard: {
    pt: 'Voltar ao Dashboard',
    es: 'Volver al Dashboard',
    fr: 'Retour au Tableau de Bord',
    it: 'Torna alla Dashboard',
    en: 'Back to Dashboard',
    de: 'Zurück zum Dashboard'
  },
  howToPlay: {
    pt: 'Como Jogar',
    es: 'Cómo Jugar',
    fr: 'Comment Jouer',
    it: 'Come Giocare',
    en: 'How to Play',
    de: 'Wie zu Spielen'
  },
  welcomeText: {
    pt: 'Bem-vindo ao FootLedger, o fantasy football revolucionário onde você constrói a sua equipa dos sonhos e compete contra outros gestores!',
    es: '¡Bienvenido a FootLedger, el fantasy football revolucionario donde construyes tu equipo de ensueño y compites contra otros gestores!',
    fr: 'Bienvenue sur FootLedger, le fantasy football révolutionnaire où vous construisez votre équipe de rêve et affrontez d\'autres managers!',
    it: 'Benvenuto su FootLedger, il fantasy football rivoluzionario dove costruisci la tua squadra dei sogni e competi contro altri manager!',
    en: 'Welcome to FootLedger, the revolutionary fantasy football where you build your dream team and compete against other managers!',
    de: 'Willkommen bei FootLedger, dem revolutionären Fantasy-Football, wo du dein Traumteam aufbaust und gegen andere Manager antrittst!'
  },
  objectiveText: {
    pt: 'O objetivo é simples: escolher os melhores jogadores, definir a melhor tática e acumular o máximo de pontos com base no desempenho real dos seus jogadores nas competições. Objetivo final: melhor rácio preço / ponto.',
    es: 'El objetivo es simple: elegir los mejores jugadores, definir la mejor táctica y acumular el máximo de puntos basándose en el rendimiento real de tus jugadores en las competiciones. Objetivo final: mejor relación precio/punto.',
    fr: 'L\'objectif est simple : choisir les meilleurs joueurs, définir la meilleure tactique et accumuler le maximum de points en fonction des performances réelles de vos joueurs dans les compétitions. Objectif final : meilleur rapport prix/point.',
    it: 'L\'obiettivo è semplice: scegliere i migliori giocatori, definire la migliore tattica e accumulare il massimo dei punti in base alle prestazioni reali dei tuoi giocatori nelle competizioni. Obiettivo finale: miglior rapporto prezzo/punto.',
    en: 'The objective is simple: choose the best players, define the best tactics and accumulate the maximum points based on your players\' real performance in competitions. Final objective: best price/point ratio.',
    de: 'Das Ziel ist einfach: die besten Spieler auswählen, die beste Taktik definieren und maximale Punkte basierend auf der tatsächlichen Leistung deiner Spieler in Wettbewerben sammeln. Endziel: bestes Preis-Punkt-Verhältnis.'
  },
  stepByStepGuide: {
    pt: 'Guia Passo a Passo',
    es: 'Guía Paso a Paso',
    fr: 'Guide Étape par Étape',
    it: 'Guida Passo dopo Passo',
    en: 'Step by Step Guide',
    de: 'Schritt-für-Schritt-Anleitung'
  },
  step1Title: {
    pt: 'Escolha a Sua Equipa',
    es: 'Elige tu Equipo',
    fr: 'Choisissez Votre Équipe',
    it: 'Scegli la Tua Squadra',
    en: 'Choose Your Team',
    de: 'Wähle Dein Team'
  },
  step1Text: {
    pt: 'Escolha uma equipa das Big Six. A seleção é permanente até ao final da temporada (30 de junho). A escolha da equipa servirá para lhe atribuir o seu orçamento, ou seja, o dinheiro que terá para comprar os jogadores. Não se esqueça... quanto maior for o dinheiro que tiver à sua disposição, maior é o número de pontos que terá que obter para ter o melhor rácio.',
    es: 'Elige un equipo de las Big Six. La selección es permanente hasta el final de la temporada (30 de junio). La elección del equipo servirá para asignarte tu presupuesto, es decir, el dinero que tendrás para comprar jugadores. No olvides... cuanto más dinero tengas a tu disposición, mayor es el número de puntos que tendrás que obtener para tener la mejor relación.',
    fr: 'Choisissez une équipe des Big Six. La sélection est permanente jusqu\'à la fin de la saison (30 juin). Le choix de l\'équipe servira à vous attribuer votre budget, c\'est-à-dire l\'argent que vous aurez pour acheter des joueurs. N\'oubliez pas... plus vous avez d\'argent à votre disposition, plus vous devez obtenir de points pour avoir le meilleur ratio.',
    it: 'Scegli una squadra delle Big Six. La selezione è permanente fino alla fine della stagione (30 giugno). La scelta della squadra servirà per assegnarti il tuo budget, ovvero i soldi che avrai per comprare giocatori. Non dimenticare... più denaro hai a disposizione, maggiore è il numero di punti che dovrai ottenere per avere il miglior rapporto.',
    en: 'Choose a team from the Big Six. The selection is permanent until the end of the season (June 30). The team choice will assign you your budget, i.e., the money you\'ll have to buy players. Don\'t forget... the more money you have at your disposal, the more points you\'ll need to achieve the best ratio.',
    de: 'Wähle ein Team aus den Big Six. Die Auswahl ist bis zum Saisonende (30. Juni) dauerhaft. Die Teamwahl bestimmt dein Budget, d.h. das Geld, das du für den Kauf von Spielern hast. Vergiss nicht... je mehr Geld du zur Verfügung hast, desto mehr Punkte musst du erzielen, um das beste Verhältnis zu erreichen.'
  },
  step2Title: {
    pt: 'Defina a Sua Tática',
    es: 'Define tu Táctica',
    fr: 'Définissez Votre Tactique',
    it: 'Definisci la Tua Tattica',
    en: 'Define Your Tactics',
    de: 'Definiere Deine Taktik'
  },
  step2Text: {
    pt: 'A primeira tática determina quais os jogadores a comprar, pois terão que ser 2 por posição. Pode alterar a tática todas as semanas, mas não pode trocar de jogadores (apenas na janela de transferências em janeiro). A tática influencia a formação dos seus 11 iniciais.',
    es: 'La primera táctica determina qué jugadores comprar, ya que deben ser 2 por posición. Puedes cambiar la táctica todas las semanas, pero no puedes intercambiar jugadores (solo en la ventana de transferencias en enero). La táctica influye en la formación de tus 11 iniciales.',
    fr: 'La première tactique détermine quels joueurs acheter, car il doit y en avoir 2 par position. Vous pouvez changer de tactique chaque semaine, mais vous ne pouvez pas échanger de joueurs (seulement pendant la fenêtre de transfert en janvier). La tactique influence la formation de vos 11 titulaires.',
    it: 'La prima tattica determina quali giocatori comprare, poiché devono essere 2 per posizione. Puoi cambiare tattica ogni settimana, ma non puoi scambiare giocatori (solo nella finestra di trasferimento a gennaio). La tattica influenza la formazione dei tuoi 11 titolari.',
    en: 'The first tactic determines which players to buy, as there must be 2 per position. You can change tactics every week, but you cannot swap players (only in the transfer window in January). Tactics influence your starting eleven formation.',
    de: 'Die erste Taktik bestimmt, welche Spieler gekauft werden sollen, da es 2 pro Position sein müssen. Du kannst die Taktik jede Woche ändern, aber keine Spieler tauschen (nur im Transferfenster im Januar). Die Taktik beeinflusst die Formation deiner Startelf.'
  },
  step3Title: {
    pt: 'Selecione os Jogadores',
    es: 'Selecciona los Jugadores',
    fr: 'Sélectionnez les Joueurs',
    it: 'Seleziona i Giocatori',
    en: 'Select the Players',
    de: 'Wähle die Spieler'
  },
  step3Text: {
    pt: 'Monte o seu plantel com 23 jogadores respeitando as posições definidas pela sua tática. Tem acesso a todos das Big Six. Esta seleção só pode ser ajustada na janela oficial de transferências... em Janeiro.',
    es: 'Monta tu plantilla con 23 jugadores respetando las posiciones definidas por tu táctica. Tienes acceso a todos los de las Big Six. Esta selección solo se puede ajustar en la ventana oficial de transferencias... en enero.',
    fr: 'Montez votre effectif avec 23 joueurs en respectant les positions définies par votre tactique. Vous avez accès à tous ceux du Big Six. Cette sélection ne peut être ajustée que lors de la fenêtre officielle de transfert... en janvier.',
    it: 'Monta la tua rosa con 23 giocatori rispettando le posizioni definite dalla tua tattica. Hai accesso a tutti quelli delle Big Six. Questa selezione può essere modificata solo nella finestra ufficiale di trasferimento... a gennaio.',
    en: 'Build your squad with 23 players respecting the positions defined by your tactics. You have access to all Big Six players. This selection can only be adjusted in the official transfer window... in January.',
    de: 'Baue deinen Kader mit 23 Spielern auf und respektiere die von deiner Taktik definierten Positionen. Du hast Zugriff auf alle Spieler der Big Six. Diese Auswahl kann nur im offiziellen Transferfenster... im Januar angepasst werden.'
  },
  step4Title: {
    pt: 'Escolha os 11 Iniciais e 5 Suplentes',
    es: 'Elige los 11 Iniciales y 5 Suplentes',
    fr: 'Choisissez les 11 Titulaires et 5 Remplaçants',
    it: 'Scegli gli 11 Titolari e 5 Riserve',
    en: 'Choose the Starting 11 and 5 Substitutes',
    de: 'Wähle die Startelf und 5 Ersatzspieler'
  },
  step4Text: {
    pt: 'Escolha semanalmente os 11 jogadores que vão pontuar. Os 11 devem seguir a tática escolhida e pontuam na totalidade, os 5 suplentes contam apenas com metade dos pontos obtidos. Esta seleção pode ser alterada todas as semanas (às terças-feiras) para maximizar os seus pontos! Porquê às terças-feiras? Existem campeonatos que têm jogos às segundas à noite e na terça-feira já pode haver jogos para a champions. Por isso todas as semanas o 11 deverá ser escolhido entre as 00:00h e as 17:00h GMT.',
    es: 'Elige semanalmente los 11 jugadores que van a puntuar. Los 11 deben seguir la táctica elegida y puntúan en su totalidad, los 5 suplentes cuentan solo con la mitad de los puntos obtenidos. ¡Esta selección se puede cambiar todas las semanas (los martes) para maximizar tus puntos! ¿Por qué los martes? Hay campeonatos que tienen partidos los lunes por la noche y el martes ya puede haber partidos de champions. Por eso todas las semanas los 11 deben elegirse entre las 00:00h y las 17:00h GMT.',
    fr: 'Choisissez chaque semaine les 11 joueurs qui vont marquer. Les 11 doivent suivre la tactique choisie et marquent entièrement, les 5 remplaçants ne comptent que la moitié des points obtenus. Cette sélection peut être modifiée chaque semaine (le mardi) pour maximiser vos points! Pourquoi le mardi? Il y a des championnats qui ont des matchs le lundi soir et le mardi il peut déjà y avoir des matchs de champions. C\'est pourquoi chaque semaine les 11 doivent être choisis entre 00:00 et 17:00 GMT.',
    it: 'Scegli settimanalmente gli 11 giocatori che andranno a segnare. Gli 11 devono seguire la tattica scelta e segnano completamente, le 5 riserve contano solo per metà dei punti ottenuti. Questa selezione può essere modificata ogni settimana (il martedì) per massimizzare i tuoi punti! Perché il martedì? Ci sono campionati che hanno partite il lunedì sera e il martedì potrebbero già esserci partite di champions. Ecco perché ogni settimana gli 11 devono essere scelti tra le 00:00 e le 17:00 GMT.',
    en: 'Choose weekly the 11 players who will score points. The 11 must follow the chosen tactics and score in full, the 5 substitutes count only half the points obtained. This selection can be changed every week (on Tuesdays) to maximize your points! Why Tuesdays? There are championships that have games on Monday nights and on Tuesday there may already be champions games. That\'s why every week the 11 must be chosen between 00:00 and 17:00 GMT.',
    de: 'Wähle wöchentlich die 11 Spieler, die Punkte erzielen werden. Die 11 müssen der gewählten Taktik folgen und erzielen volle Punkte, die 5 Ersatzspieler zählen nur die Hälfte der erzielten Punkte. Diese Auswahl kann jede Woche (dienstags) geändert werden, um deine Punkte zu maximieren! Warum dienstags? Es gibt Meisterschaften, die Montagabendspiele haben, und am Dienstag kann es bereits Champions-Spiele geben. Deshalb müssen jede Woche die 11 zwischen 00:00 und 17:00 GMT ausgewählt werden.'
  },
  step5Title: {
    pt: 'Participe em Leilões (Opcional)',
    es: 'Participa en Subastas (Opcional)',
    fr: 'Participez aux Enchères (Optionnel)',
    it: 'Partecipa alle Aste (Opzionale)',
    en: 'Participate in Auctions (Optional)',
    de: 'Teilnahme an Auktionen (Optional)'
  },
  step5Text: {
    pt: 'Use Footledgers para licitar em jogadores exclusivos que não estão disponíveis na pool normal. Precisa de ter um Dragon NFT verificado para participar nos leilões.',
    es: 'Usa Footledgers para licitar por jugadores exclusivos que no están disponibles en el grupo normal. Necesitas tener un Dragon NFT verificado para participar en las subastas.',
    fr: 'Utilisez Footledgers pour enchérir sur des joueurs exclusifs qui ne sont pas disponibles dans le pool normal. Vous devez avoir un Dragon NFT vérifié pour participer aux enchères.',
    it: 'Usa Footledgers per fare offerte su giocatori esclusivi che non sono disponibili nel pool normale. Devi avere un Dragon NFT verificato per partecipare alle aste.',
    en: 'Use Footledgers to bid on exclusive players that are not available in the normal pool. You need to have a verified Dragon NFT to participate in auctions.',
    de: 'Verwende Footledgers, um auf exklusive Spieler zu bieten, die im normalen Pool nicht verfügbar sind. Du musst ein verifiziertes Dragon NFT haben, um an Auktionen teilzunehmen.'
  },
  step6Title: {
    pt: 'Acompanhe a Classificação',
    es: 'Sigue la Clasificación',
    fr: 'Suivez le Classement',
    it: 'Segui la Classifica',
    en: 'Follow the Rankings',
    de: 'Verfolge die Rangliste'
  },
  step6Text: {
    pt: 'Veja a sua posição na classificação global e compare-se com outros gestores. Os pontos são atualizados automaticamente com base no desempenho real dos seus jogadores.',
    es: 'Ve tu posición en la clasificación global y compárate con otros gestores. Los puntos se actualizan automáticamente según el rendimiento real de tus jugadores.',
    fr: 'Voyez votre position dans le classement mondial et comparez-vous avec d\'autres managers. Les points sont mis à jour automatiquement en fonction des performances réelles de vos joueurs.',
    it: 'Vedi la tua posizione nella classifica globale e confrontati con altri manager. I punti vengono aggiornati automaticamente in base alle prestazioni reali dei tuoi giocatori.',
    en: 'See your position in the global rankings and compare yourself with other managers. Points are automatically updated based on your players\' real performance.',
    de: 'Sieh deine Position in der globalen Rangliste und vergleiche dich mit anderen Managern. Punkte werden automatisch basierend auf der tatsächlichen Leistung deiner Spieler aktualisiert.'
  },
  videoTutorial: {
    pt: 'Vídeo Tutorial',
    es: 'Video Tutorial',
    fr: 'Tutoriel Vidéo',
    it: 'Video Tutorial',
    en: 'Video Tutorial',
    de: 'Video-Tutorial'
  },
  videoComingSoon: {
    pt: 'Vídeo tutorial em breve',
    es: 'Video tutorial próximamente',
    fr: 'Tutoriel vidéo bientôt',
    it: 'Video tutorial prossimamente',
    en: 'Video tutorial coming soon',
    de: 'Video-Tutorial kommt bald'
  },
  waitForUpdates: {
    pt: 'Aguarde as próximas atualizações',
    es: 'Espera las próximas actualizaciones',
    fr: 'Attendez les prochaines mises à jour',
    it: 'Attendere i prossimi aggiornamenti',
    en: 'Wait for upcoming updates',
    de: 'Warte auf kommende Updates'
  },
  gameRules: {
    pt: 'Regras do Jogo',
    es: 'Reglas del Juego',
    fr: 'Règles du Jeu',
    it: 'Regole del Gioco',
    en: 'Game Rules',
    de: 'Spielregeln'
  },
  teamSelectionTitle: {
    pt: 'Seleção de Equipa',
    es: 'Selección de Equipo',
    fr: 'Sélection d\'Équipe',
    it: 'Selezione Squadra',
    en: 'Team Selection',
    de: 'Teamauswahl'
  },
  tacticSelectionTitle: {
    pt: 'Seleção de Tática',
    es: 'Selección de Táctica',
    fr: 'Sélection de Tactique',
    it: 'Selezione Tattica',
    en: 'Tactic Selection',
    de: 'Taktikwahl'
  },
  playerSelectionTitle: {
    pt: 'Seleção de Jogadores',
    es: 'Selección de Jugadores',
    fr: 'Sélection de Joueurs',
    it: 'Selezione Giocatori',
    en: 'Player Selection',
    de: 'Spielerauswahl'
  },
  startingElevenTitle: {
    pt: 'Seleção dos 11 Iniciais',
    es: 'Selección de los 11 Iniciales',
    fr: 'Sélection des 11 Titulaires',
    it: 'Selezione degli 11 Titolari',
    en: 'Starting Eleven Selection',
    de: 'Auswahl der Startelf'
  },
  pointsSystemTitle: {
    pt: 'Sistema de Pontos',
    es: 'Sistema de Puntos',
    fr: 'Système de Points',
    it: 'Sistema di Punti',
    en: 'Points System',
    de: 'Punktesystem'
  },
  footledgersAuctionsTitle: {
    pt: 'Footledgers e Leilões',
    es: 'Footledgers y Subastas',
    fr: 'Footledgers et Enchères',
    it: 'Footledgers e Aste',
    en: 'Footledgers and Auctions',
    de: 'Footledgers und Auktionen'
  },
  leaguesTitle: {
    pt: 'Ligas',
    es: 'Ligas',
    fr: 'Ligues',
    it: 'Leghe',
    en: 'Leagues',
    de: 'Ligen'
  },
  faqTitle: {
    pt: 'FAQ - Perguntas Frequentes',
    es: 'FAQ - Preguntas Frecuentes',
    fr: 'FAQ - Questions Fréquentes',
    it: 'FAQ - Domande Frequenti',
    en: 'FAQ - Frequently Asked Questions',
    de: 'FAQ - Häufig gestellte Fragen'
  },
  faq1Question: {
    pt: 'Posso mudar a minha equipa durante a temporada?',
    es: '¿Puedo cambiar mi equipo durante la temporada?',
    fr: 'Puis-je changer mon équipe pendant la saison ?',
    it: 'Posso cambiare la mia squadra durante la stagione?',
    en: 'Can I change my team during the season?',
    de: 'Kann ich mein Team während der Saison wechseln?'
  },
  faq1Answer: {
    pt: 'Não. A escolha da equipa é permanente até ao final da temporada (30 de junho). No fim será feito um acerto favorável se o valor atualizado do clube tiver valorizado... e um acerto desfavorável se o valor do clube tiver desvalorizado.',
    es: 'No. La elección del equipo es permanente hasta el final de la temporada (30 de junio). Al final se hará un ajuste favorable si el valor actualizado del club ha aumentado... y un ajuste desfavorable si el valor del club ha disminuido.',
    fr: 'Non. Le choix de l\'équipe est permanent jusqu\'à la fin de la saison (30 juin). À la fin, un ajustement favorable sera fait si la valeur actualisée du club a augmenté... et un ajustement défavorable si la valeur du club a diminué.',
    it: 'No. La scelta della squadra è permanente fino alla fine della stagione (30 giugno). Alla fine verrà fatto un aggiustamento favorevole se il valore aggiornato del club è aumentato... e un aggiustamento sfavorevole se il valore del club è diminuito.',
    en: 'No. The team choice is permanent until the end of the season (June 30). At the end, a favorable adjustment will be made if the club\'s updated value has increased... and an unfavorable adjustment if the club\'s value has decreased.',
    de: 'Nein. Die Teamwahl ist bis zum Saisonende (30. Juni) dauerhaft. Am Ende wird eine günstige Anpassung vorgenommen, wenn der aktualisierte Wert des Clubs gestiegen ist... und eine ungünstige Anpassung, wenn der Wert des Clubs gesunken ist.'
  },
  faq2Question: {
    pt: 'Com que frequência posso mudar os meus jogadores?',
    es: '¿Con qué frecuencia puedo cambiar mis jugadores?',
    fr: 'À quelle fréquence puis-je changer mes joueurs ?',
    it: 'Con che frequenza posso cambiare i miei giocatori?',
    en: 'How often can I change my players?',
    de: 'Wie oft kann ich meine Spieler wechseln?'
  },
  faq2Answer: {
    pt: 'Pode alterar o seu plantel de 23 jogadores apenas na janela de transferências em Janeiro. No entanto, os seus 11 iniciais podem ser alterados todas as semanas.',
    es: 'Puedes cambiar tu plantilla de 23 jugadores solo en la ventana de transferencias en enero. Sin embargo, tus 11 iniciales se pueden cambiar todas las semanas.',
    fr: 'Vous pouvez modifier votre effectif de 23 joueurs uniquement pendant la fenêtre de transfert en janvier. Cependant, vos 11 titulaires peuvent être modifiés chaque semaine.',
    it: 'Puoi modificare la tua rosa di 23 giocatori solo nella finestra di trasferimento a gennaio. Tuttavia, i tuoi 11 titolari possono essere modificati ogni settimana.',
    en: 'You can change your squad of 23 players only in the transfer window in January. However, your starting 11 can be changed every week.',
    de: 'Du kannst deinen Kader von 23 Spielern nur im Transferfenster im Januar ändern. Deine Startelf kann jedoch jede Woche geändert werden.'
  },
  faq3Question: {
    pt: 'Como funcionam as ligas privadas?',
    es: '¿Cómo funcionan las ligas privadas?',
    fr: 'Comment fonctionnent les ligues privées ?',
    it: 'Come funzionano le leghe private?',
    en: 'How do private leagues work?',
    de: 'Wie funktionieren private Ligen?'
  },
  faq3Answer: {
    pt: 'Ligas privadas precisam de um Dragon NFT verificado para criar e custam 100 Footledgers para entrar. Recebe um código de convite para partilhar com amigos e pode competir numa classificação privada.',
    es: 'Las ligas privadas necesitan un Dragon NFT verificado para crear y cuestan 100 Footledgers para entrar. Recibes un código de invitación para compartir con amigos y puedes competir en una clasificación privada.',
    fr: 'Les ligues privées nécessitent un Dragon NFT vérifié pour créer et coûtent 100 Footledgers pour entrer. Vous recevez un code d\'invitation à partager avec des amis et pouvez concourir dans un classement privé.',
    it: 'Le leghe private richiedono un Dragon NFT verificato per creare e costano 100 Footledgers per entrare. Ricevi un codice di invito da condividere con gli amici e puoi competere in una classifica privata.',
    en: 'Private leagues need a verified Dragon NFT to create and cost 100 Footledgers to join. You receive an invitation code to share with friends and can compete in a private ranking.',
    de: 'Private Ligen benötigen ein verifiziertes Dragon NFT zum Erstellen und kosten 100 Footledgers zum Beitreten. Du erhältst einen Einladungscode zum Teilen mit Freunden und kannst in einer privaten Rangliste konkurrieren.'
  },
  faq4Question: {
    pt: 'Posso ter jogadores da minha equipa adversária?',
    es: '¿Puedo tener jugadores del equipo adversario?',
    fr: 'Puis-je avoir des joueurs de l\'équipe adverse ?',
    it: 'Posso avere giocatori della squadra avversaria?',
    en: 'Can I have players from my opponent team?',
    de: 'Kann ich Spieler des gegnerischen Teams haben?'
  },
  faq4Answer: {
    pt: 'Sim! Apesar de escolher uma equipa para representar, pode selecionar jogadores de qualquer equipa das Big Six para o seu plantel.',
    es: '¡Sí! A pesar de elegir un equipo para representar, puedes seleccionar jugadores de cualquier equipo de las Big Six para tu plantilla.',
    fr: 'Oui ! Bien que vous choisissiez une équipe à représenter, vous pouvez sélectionner des joueurs de n\'importe quelle équipe du Big Six pour votre effectif.',
    it: 'Sì! Nonostante scegli una squadra da rappresentare, puoi selezionare giocatori di qualsiasi squadra delle Big Six per la tua rosa.',
    en: 'Yes! Although you choose a team to represent, you can select players from any Big Six team for your squad.',
    de: 'Ja! Obwohl du ein Team auswählst, das du vertrittst, kannst du Spieler von jedem Big Six Team für deinen Kader auswählen.'
  },
  faq5Question: {
    pt: 'O que acontece se um jogador não jogar numa semana?',
    es: '¿Qué pasa si un jugador no juega en una semana?',
    fr: 'Que se passe-t-il si un joueur ne joue pas pendant une semaine ?',
    it: 'Cosa succede se un giocatore non gioca in una settimana?',
    en: 'What happens if a player doesn\'t play in a week?',
    de: 'Was passiert, wenn ein Spieler eine Woche nicht spielt?'
  },
  faq5Answer: {
    pt: 'Se um jogador dos seus 11 iniciais não jogar, ele simplesmente não pontua nessa semana. É importante escolher jogadores que tenham maior probabilidade de jogar.',
    es: 'Si un jugador de tus 11 iniciales no juega, simplemente no puntúa esa semana. Es importante elegir jugadores que tengan mayor probabilidad de jugar.',
    fr: 'Si un joueur de vos 11 titulaires ne joue pas, il ne marque tout simplement pas cette semaine. Il est important de choisir des joueurs qui ont une plus grande probabilité de jouer.',
    it: 'Se un giocatore dei tuoi 11 titolari non gioca, semplicemente non segna quella settimana. È importante scegliere giocatori che hanno maggiore probabilità di giocare.',
    en: 'If one of your starting 11 players doesn\'t play, they simply don\'t score that week. It\'s important to choose players who are more likely to play.',
    de: 'Wenn einer deiner Startelfspieler nicht spielt, erzielt er einfach keine Punkte in dieser Woche. Es ist wichtig, Spieler auszuwählen, die eher spielen werden.'
  },
  faq6Question: {
    pt: 'Como obtenho Footledgers?',
    es: '¿Cómo obtengo Footledgers?',
    fr: 'Comment obtenir des Footledgers ?',
    it: 'Come ottengo Footledgers?',
    en: 'How do I get Footledgers?',
    de: 'Wie erhalte ich Footledgers?'
  },
  faq6Answer: {
    pt: 'Pode obter Footledgers criando uma conta na DAO1 através do link de referral ou trocando outras criptomoedas por Footledgers na DEX da Apertum.',
    es: 'Puedes obtener Footledgers creando una cuenta en DAO1 através del enlace de referencia o intercambiando otras criptomonedas por Footledgers en el DEX de Apertum.',
    fr: 'Vous pouvez obtenir des Footledgers en créant un compte sur DAO1 via le lien de parrainage ou en échangeant d\'autres cryptomonnaies contre des Footledgers sur le DEX d\'Apertum.',
    it: 'Puoi ottenere Footledgers creando un account su DAO1 tramite il link di riferimento o scambiando altre criptovalute per Footledgers sul DEX di Apertum.',
    en: 'You can get Footledgers by creating a DAO1 account through the referral link or by exchanging other cryptocurrencies for Footledgers on Apertum\'s DEX.',
    de: 'Du kannst Footledgers erhalten, indem du ein DAO1-Konto über den Empfehlungslink erstellst oder andere Kryptowährungen gegen Footledgers auf Apertums DEX tauschst.'
  },
  faq7Question: {
    pt: 'Preciso de NFT para jogar?',
    es: '¿Necesito NFT para jugar?',
    fr: 'Ai-je besoin de NFT pour jouer ?',
    it: 'Ho bisogno di NFT per giocare?',
    en: 'Do I need NFT to play?',
    de: 'Brauche ich NFT zum Spielen?'
  },
  faq7Answer: {
    pt: 'Não necessariamente. Pode jogar normalmente sem NFT. No entanto, para participar em leilões de jogadores exclusivos, precisa de ter um Dragon NFT verificado.',
    es: 'No necesariamente. Puedes jugar normalmente sin NFT. Sin embargo, para participar en subastas de jugadores exclusivos, necesitas tener un Dragon NFT verificado.',
    fr: 'Pas nécessairement. Vous pouvez jouer normalement sans NFT. Cependant, pour participer aux enchères de joueurs exclusifs, vous devez avoir un Dragon NFT vérifié.',
    it: 'Non necessariamente. Puoi giocare normalmente senza NFT. Tuttavia, per partecipare alle aste di giocatori esclusivi, devi avere un Dragon NFT verificato.',
    en: 'Not necessarily. You can play normally without NFT. However, to participate in exclusive player auctions, you need to have a verified Dragon NFT.',
    de: 'Nicht unbedingt. Du kannst normal ohne NFT spielen. Um jedoch an exklusiven Spielerauktionen teilzunehmen, benötigst du ein verifiziertes Dragon NFT.'
  },
  faq8Question: {
    pt: 'Quando são atualizados os pontos?',
    es: '¿Cuándo se actualizan los puntos?',
    fr: 'Quand les points sont-ils mis à jour ?',
    it: 'Quando vengono aggiornati i punti?',
    en: 'When are points updated?',
    de: 'Wann werden Punkte aktualisiert?'
  },
  faq8Answer: {
    pt: 'Os pontos são atualizados automaticamente após cada jornada com base nas estatísticas reais dos jogadores nos seus jogos.',
    es: 'Los puntos se actualizan automáticamente después de cada jornada según las estadísticas reales de los jugadores en sus partidos.',
    fr: 'Les points sont mis à jour automatiquement après chaque journée en fonction des statistiques réelles des joueurs dans leurs matchs.',
    it: 'I punti vengono aggiornati automaticamente dopo ogni giornata in base alle statistiche reali dei giocatori nelle loro partite.',
    en: 'Points are automatically updated after each matchday based on the players\' actual statistics in their games.',
    de: 'Punkte werden automatisch nach jedem Spieltag basierend auf den tatsächlichen Statistiken der Spieler in ihren Spielen aktualisiert.'
  },
  faq9Question: {
    pt: 'O que acontece se esquecer de escolher os 11 iniciais?',
    es: '¿Qué pasa si olvido elegir los 11 iniciales?',
    fr: 'Que se passe-t-il si j\'oublie de choisir les 11 titulaires ?',
    it: 'Cosa succede se dimentico di scegliere gli 11 titolari?',
    en: 'What happens if I forget to choose the starting 11?',
    de: 'Was passiert, wenn ich vergesse, die Startelf auszuwählen?'
  },
  faq9Answer: {
    pt: 'Se não selecionar os 11 iniciais numa semana, não pontuará nessa jornada. É importante fazer a seleção semanalmente para não perder pontos!',
    es: 'Si no seleccionas los 11 iniciales en una semana, no puntuarás en esa jornada. ¡Es importante hacer la selección semanalmente para no perder puntos!',
    fr: 'Si vous ne sélectionnez pas les 11 titulaires dans une semaine, vous ne marquerez pas lors de cette journée. Il est important de faire la sélection chaque semaine pour ne pas perdre de points !',
    it: 'Se non selezioni gli 11 titolari in una settimana, non segnerai in quella giornata. È importante fare la selezione settimanalmente per non perdere punti!',
    en: 'If you don\'t select the starting 11 in a week, you won\'t score that matchday. It\'s important to make the selection weekly to not lose points!',
    de: 'Wenn du die Startelf in einer Woche nicht auswählst, erzielst du an diesem Spieltag keine Punkte. Es ist wichtig, die Auswahl wöchentlich zu treffen, um keine Punkte zu verlieren!'
  },
  needMoreHelp: {
    pt: 'Precisa de Mais Ajuda?',
    es: '¿Necesitas Más Ayuda?',
    fr: 'Besoin de Plus d\'Aide ?',
    it: 'Hai Bisogno di Più Aiuto?',
    en: 'Need More Help?',
    de: 'Benötigst Du Mehr Hilfe?'
  },
  needMoreHelpText: {
    pt: 'Se tiver dúvidas adicionais ou encontrar algum problema, entre em contacto com a nossa equipa de suporte.',
    es: 'Si tienes dudas adicionales o encuentras algún problema, contacta con nuestro equipo de soporte.',
    fr: 'Si vous avez des questions supplémentaires ou rencontrez un problème, contactez notre équipe de support.',
    it: 'Se hai domande aggiuntive o incontri qualche problema, contatta il nostro team di supporto.',
    en: 'If you have additional questions or encounter any problem, contact our support team.',
    de: 'Wenn du zusätzliche Fragen hast oder auf ein Problem stößt, kontaktiere unser Support-Team.'
  },
  support: {
    pt: 'Suporte',
    es: 'Soporte',
    fr: 'Support',
    it: 'Supporto',
    en: 'Support',
    de: 'Support'
  }
};

export function getTutorialTranslation<K extends keyof TutorialTranslations>(
  key: K,
  language: Language
): string {
  return tutorialTranslations[key][language] || tutorialTranslations[key]['en'];
}
