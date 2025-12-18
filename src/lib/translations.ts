export type Language = 'pt' | 'es' | 'fr' | 'it' | 'en' | 'de';

export const languages = {
  pt: 'Português',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  en: 'English',
  de: 'Deutsch'
} as const;

export const translations = {
  dashboard: {
    title: {
      pt: 'Dashboard',
      es: 'Panel de Control',
      fr: 'Tableau de Bord',
      it: 'Pannello di Controllo',
      en: 'Dashboard',
      de: 'Übersicht'
    },
    subtitle: {
      pt: 'Gerencie suas seleções do Football Ledger',
      es: 'Gestiona tus selecciones de Football Ledger',
      fr: 'Gérez vos sélections Football Ledger',
      it: 'Gestisci le tue selezioni Football Ledger',
      en: 'Manage your Football Ledger selections',
      de: 'Verwalten Sie Ihre Football Ledger Auswahlen'
    },
    pickYourTeam: {
      pt: 'Escolha Sua Equipa',
      es: 'Elige Tu Equipo',
      fr: 'Choisissez Votre Équipe',
      it: 'Scegli La Tua Squadra',
      en: 'Pick Your Team',
      de: 'Wähle Dein Team'
    },
    selectFavoriteTeam: {
      pt: 'Selecione sua equipa favorita das Big 6',
      es: 'Selecciona tu equipo favorito de las Big 6',
      fr: 'Sélectionnez votre équipe préférée des Big 6',
      it: 'Seleziona la tua squadra preferita dalle Big 6',
      en: 'Select your favorite team from The Big 6 leagues',
      de: 'Wähle dein Lieblingsteam aus den Big 6 Ligen'
    },
    chooseTacticalSystem: {
      pt: 'Escolha o Sistema Tático',
      es: 'Elige el Sistema Táctico',
      fr: 'Choisissez le Système Tactique',
      it: 'Scegli il Sistema Tattico',
      en: 'Choose Tactical System',
      de: 'Wähle Taktisches System'
    },
    pickTeamFirst: {
      pt: 'Escolha sua equipa primeiro',
      es: 'Elige tu equipo primero',
      fr: "Choisissez d'abord votre équipe",
      it: 'Scegli prima la tua squadra',
      en: 'Pick your team first',
      de: 'Wähle zuerst dein Team'
    },
    selectOnceTactic: {
      pt: 'Selecione uma vez depois de escolher sua equipa (condiciona compras de jogadores)',
      es: 'Selecciona una vez después de elegir tu equipo (condiciona compras de jugadores)',
      fr: "Sélectionnez une fois après avoir choisi votre équipe (conditionne l'achat de joueurs)",
      it: 'Seleziona una volta dopo aver scelto la tua squadra (condiziona gli acquisti dei giocatori)',
      en: 'Select once after picking your team (conditions player purchases)',
      de: 'Einmal nach Teamwahl auswählen (bedingt Spielerkäufe)'
    },
    pickYourPlayers: {
      pt: 'Escolha Seus Jogadores',
      es: 'Elige Tus Jugadores',
      fr: 'Choisissez Vos Joueurs',
      it: 'Scegli I Tuoi Giocatori',
      en: 'Pick Your Players',
      de: 'Wähle Deine Spieler'
    },
    selectTacticFirst: {
      pt: 'Selecione sua tática primeiro',
      es: 'Selecciona tu táctica primero',
      fr: "Sélectionnez d'abord votre tactique",
      it: 'Seleziona prima la tua tattica',
      en: 'Select your tactic first',
      de: 'Wähle zuerst deine Taktik'
    },
    build23PlayerSquad: {
      pt: 'Monte seu plantel de 23 jogadores respeitando as restrições da sua tática',
      es: 'Construye tu plantilla de 23 jugadores respetando las restricciones de tu táctica',
      fr: 'Construisez votre équipe de 23 joueurs en respectant les contraintes de votre tactique',
      it: 'Costruisci la tua rosa di 23 giocatori rispettando i vincoli della tua tattica',
      en: 'Build your 23-player squad respecting your tactic constraints',
      de: 'Baue deinen 23-Spieler-Kader unter Beachtung deiner Taktik-Einschränkungen'
    },
    pickElevenOfWeek: {
      pt: 'Escolha Os 11 Da Semana',
      es: 'Elige Los 11 De La Semana',
      fr: 'Choisissez Les 11 De La Semaine',
      it: 'Scegli Gli 11 Della Settimana',
      en: 'Pick Eleven Of The Week',
      de: 'Wähle Die 11 Der Woche'
    },
    selectPlayersFirst: {
      pt: 'Selecione seus jogadores primeiro',
      es: 'Selecciona tus jugadores primero',
      fr: "Sélectionnez d'abord vos joueurs",
      it: 'Seleziona prima i tuoi giocatori',
      en: 'Select your players first',
      de: 'Wähle zuerst deine Spieler'
    },
    selectWeeklyEleven: {
      pt: 'Selecione seus 11 iniciais toda semana das suas 23 contratações',
      es: 'Selecciona tus 11 titulares cada semana de tus 23 fichajes',
      fr: 'Sélectionnez vos 11 titulaires chaque semaine parmi vos 23 recrues',
      it: 'Seleziona i tuoi 11 titolari ogni settimana dalle tue 23 acquisizioni',
      en: 'Select your weekly starting eleven from your 23 signings',
      de: 'Wähle jede Woche deine Startelf aus deinen 23 Verpflichtungen'
    },
    myTeam: {
      pt: 'A Minha Equipa',
      es: 'Mi Equipo',
      fr: 'Mon Équipe',
      it: 'La Mia Squadra',
      en: 'My Team',
      de: 'Mein Team'
    },
    viewYourSquad: {
      pt: 'Veja seu plantel completo de 23 jogadores e onze semanal',
      es: 'Ver tu plantilla completa de 23 jugadores y once semanal',
      fr: 'Voir votre équipe complète de 23 joueurs et votre onze hebdomadaire',
      it: 'Visualizza la tua rosa completa di 23 giocatori e undici settimanale',
      en: 'View your complete 23-player squad and weekly eleven',
      de: 'Zeige deinen vollständigen 23-Spieler-Kader und wöchentliche Elf'
    },
    leaderboard: {
      pt: 'Classificação',
      es: 'Clasificación',
      fr: 'Classement',
      it: 'Classifica',
      en: 'Leaderboard',
      de: 'Bestenliste'
    },
    seeTopManagers: {
      pt: 'Veja os melhores gestores e compare seu desempenho',
      es: 'Ver los mejores gestores y comparar tu rendimiento',
      fr: 'Voir les meilleurs gestionnaires et comparer vos performances',
      it: 'Visualizza i migliori manager e confronta le tue prestazioni',
      en: 'See the top managers and compare your performance',
      de: 'Siehe die besten Manager und vergleiche deine Leistung'
    },
    playerAuction: {
      pt: 'Leilão de Jogadores',
      es: 'Subasta de Jugadores',
      fr: 'Enchères de Joueurs',
      it: 'Asta Giocatori',
      en: 'Player Auction',
      de: 'Spielerauktion'
    },
    bidExclusivePlayers: {
      pt: 'Faça lances em jogadores exclusivos usando Footledgers',
      es: 'Puja por jugadores exclusivos usando Footledgers',
      fr: 'Enchérissez sur des joueurs exclusifs en utilisant des Footledgers',
      it: 'Fai offerte per giocatori esclusivi usando Footledgers',
      en: 'Bid on exclusive players using Footledgers',
      de: 'Biete auf exklusive Spieler mit Footledgers'
    },
    topPlayers: {
      pt: 'Melhores Jogadores',
      es: 'Mejores Jugadores',
      fr: 'Meilleurs Joueurs',
      it: 'Migliori Giocatori',
      en: 'Top Players',
      de: 'Top-Spieler'
    },
    viewBestPerformers: {
      pt: 'Veja os jogadores com melhor desempenho da temporada',
      es: 'Ver los jugadores con mejor rendimiento de la temporada',
      fr: 'Voir les meilleurs joueurs de la saison',
      it: 'Visualizza i giocatori con le migliori prestazioni della stagione',
      en: 'View the best performing players of the season',
      de: 'Zeige die besten Spieler der Saison'
    },
    myLeague: {
      pt: 'A Minha Liga',
      es: 'Mi Liga',
      fr: 'Ma Ligue',
      it: 'La Mia Lega',
      en: 'My League',
      de: 'Meine Liga'
    },
    createJoinPrivateLeagues: {
      pt: 'Crie ou entre em ligas privadas com seus amigos',
      es: 'Crea o únete a ligas privadas con tus amigos',
      fr: 'Créez ou rejoignez des ligues privées avec vos amis',
      it: 'Crea o unisciti a leghe private con i tuoi amici',
      en: 'Create or join private leagues with your friends',
      de: 'Erstelle oder tritt privaten Ligen mit deinen Freunden bei'
    },
    tutorial: {
      pt: 'Tutorial',
      es: 'Tutorial',
      fr: 'Tutoriel',
      it: 'Tutorial',
      en: 'Tutorial',
      de: 'Anleitung'
    },
    learnHowToPlay: {
      pt: 'Aprenda como jogar e tire suas dúvidas',
      es: 'Aprende cómo jugar y resuelve tus dudas',
      fr: 'Apprenez à jouer et résolvez vos doutes',
      it: 'Impara a giocare e risolvi i tuoi dubbi',
      en: 'Learn how to play and get your questions answered',
      de: 'Lerne wie man spielt und bekomme Antworten auf deine Fragen'
    },
    openNow: {
      pt: 'Aberto Agora',
      es: 'Abierto Ahora',
      fr: 'Ouvert Maintenant',
      it: 'Aperto Ora',
      en: 'Open Now',
      de: 'Jetzt Offen'
    },
    closed: {
      pt: 'Fechado',
      es: 'Cerrado',
      fr: 'Fermé',
      it: 'Chiuso',
      en: 'Closed',
      de: 'Geschlossen'
    },
    completed: {
      pt: 'Concluído',
      es: 'Completado',
      fr: 'Terminé',
      it: 'Completato',
      en: 'Completed',
      de: 'Abgeschlossen'
    },
    logout: {
      pt: 'Sair',
      es: 'Cerrar Sesión',
      fr: 'Déconnexion',
      it: 'Esci',
      en: 'Logout',
      de: 'Abmelden'
    },
    liveAuctions: {
      pt: 'Leilões Ao Vivo',
      es: 'Subastas En Vivo',
      fr: 'Enchères En Direct',
      it: 'Aste Dal Vivo',
      en: 'Live Auctions',
      de: 'Live-Auktionen'
    },
    alwaysAvailable: {
      pt: 'Sempre Disponível',
      es: 'Siempre Disponible',
      fr: 'Toujours Disponible',
      it: 'Sempre Disponibile',
      en: 'Always Available',
      de: 'Immer Verfügbar'
    },
    checkYourTeamAnytime: {
      pt: 'Consulte a sua equipa a qualquer momento',
      es: 'Consulta tu equipo en cualquier momento',
      fr: 'Consultez votre équipe à tout moment',
      it: 'Consulta la tua squadra in qualsiasi momento',
      en: 'Check your team anytime',
      de: 'Überprüfe dein Team jederzeit'
    },
    tuesdayTimeSlot: {
      pt: 'Terça-feira 00:00-17:00',
      es: 'Martes 00:00-17:00',
      fr: 'Mardi 00:00-17:00',
      it: 'Martedì 00:00-17:00',
      en: 'Tuesday 00:00-17:00',
      de: 'Dienstag 00:00-17:00'
    }
  },
  common: {
    back: {
      pt: 'Voltar',
      es: 'Volver',
      fr: 'Retour',
      it: 'Indietro',
      en: 'Back',
      de: 'Zurück'
    },
    save: {
      pt: 'Guardar',
      es: 'Guardar',
      fr: 'Enregistrer',
      it: 'Salva',
      en: 'Save',
      de: 'Speichern'
    },
    saving: {
      pt: 'A guardar...',
      es: 'Guardando...',
      fr: 'Enregistrement...',
      it: 'Salvataggio...',
      en: 'Saving...',
      de: 'Speichern...'
    },
    loading: {
      pt: 'A carregar...',
      es: 'Cargando...',
      fr: 'Chargement...',
      it: 'Caricamento...',
      en: 'Loading...',
      de: 'Laden...'
    },
    cancel: {
      pt: 'Cancelar',
      es: 'Cancelar',
      fr: 'Annuler',
      it: 'Annulla',
      en: 'Cancel',
      de: 'Abbrechen'
    },
    confirm: {
      pt: 'Confirmar',
      es: 'Confirmar',
      fr: 'Confirmer',
      it: 'Conferma',
      en: 'Confirm',
      de: 'Bestätigen'
    },
    filter: {
      pt: 'Filtrar',
      es: 'Filtrar',
      fr: 'Filtrer',
      it: 'Filtra',
      en: 'Filter',
      de: 'Filtern'
    },
    search: {
      pt: 'Pesquisar',
      es: 'Buscar',
      fr: 'Rechercher',
      it: 'Cerca',
      en: 'Search',
      de: 'Suchen'
    },
    all: {
      pt: 'Todos',
      es: 'Todos',
      fr: 'Tous',
      it: 'Tutti',
      en: 'All',
      de: 'Alle'
    },
    points: {
      pt: 'Pontos',
      es: 'Puntos',
      fr: 'Points',
      it: 'Punti',
      en: 'Points',
      de: 'Punkte'
    },
    value: {
      pt: 'Valor',
      es: 'Valor',
      fr: 'Valeur',
      it: 'Valore',
      en: 'Value',
      de: 'Wert'
    },
    team: {
      pt: 'Equipa',
      es: 'Equipo',
      fr: 'Équipe',
      it: 'Squadra',
      en: 'Team',
      de: 'Mannschaft'
    },
    player: {
      pt: 'Jogador',
      es: 'Jugador',
      fr: 'Joueur',
      it: 'Giocatore',
      en: 'Player',
      de: 'Spieler'
    },
    players: {
      pt: 'Jogadores',
      es: 'Jugadores',
      fr: 'Joueurs',
      it: 'Giocatori',
      en: 'Players',
      de: 'Spieler'
    }
  },
  pickTeam: {
    title: {
      pt: 'Escolha uma Equipa',
      es: 'Elige un Equipo',
      fr: 'Choisissez une Équipe',
      it: 'Scegli una Squadra',
      en: 'Pick a Team',
      de: 'Wähle ein Team'
    },
    subtitle: {
      pt: 'Escolha a sua equipa para começar',
      es: 'Elige tu equipo para empezar',
      fr: 'Choisissez votre équipe pour commencer',
      it: 'Scegli la tua squadra per iniziare',
      en: 'Choose your team to get started',
      de: 'Wähle dein Team um zu beginnen'
    },
    locked: {
      pt: 'Seleção de Equipa Bloqueada',
      es: 'Selección de Equipo Bloqueada',
      fr: 'Sélection d\'Équipe Verrouillée',
      it: 'Selezione Squadra Bloccata',
      en: 'Team Selection Locked',
      de: 'Teamauswahl Gesperrt'
    },
    lockedMessage: {
      pt: 'A seleção de equipa estará disponível a partir de 1 de janeiro de 2025',
      es: 'La selección de equipo estará disponible a partir del 1 de enero de 2025',
      fr: 'La sélection d\'équipe sera disponible à partir du 1er janvier 2025',
      it: 'La selezione della squadra sarà disponibile dal 1 gennaio 2025',
      en: 'Team selection will be available starting January 1st, 2025',
      de: 'Teamauswahl verfügbar ab 1. Januar 2025'
    },
    filterByLeague: {
      pt: 'Filtrar por Liga',
      es: 'Filtrar por Liga',
      fr: 'Filtrer par Ligue',
      it: 'Filtra per Lega',
      en: 'Filter by League',
      de: 'Nach Liga filtern'
    },
    searchTeams: {
      pt: 'Pesquisar equipas...',
      es: 'Buscar equipos...',
      fr: 'Rechercher des équipes...',
      it: 'Cerca squadre...',
      en: 'Search teams...',
      de: 'Teams suchen...'
    },
    filterByValue: {
      pt: 'Filtrar por Valor',
      es: 'Filtrar por Valor',
      fr: 'Filtrer par Valeur',
      it: 'Filtra per Valore',
      en: 'Filter by Value',
      de: 'Nach Wert filtern'
    },
    highValue: {
      pt: 'Alto Valor (>100M)',
      es: 'Alto Valor (>100M)',
      fr: 'Haute Valeur (>100M)',
      it: 'Alto Valore (>100M)',
      en: 'High Value (>100M)',
      de: 'Hoher Wert (>100M)'
    },
    mediumValue: {
      pt: 'Médio Valor (50-100M)',
      es: 'Valor Medio (50-100M)',
      fr: 'Valeur Moyenne (50-100M)',
      it: 'Valore Medio (50-100M)',
      en: 'Medium Value (50-100M)',
      de: 'Mittlerer Wert (50-100M)'
    },
    lowValue: {
      pt: 'Baixo Valor (<50M)',
      es: 'Bajo Valor (<50M)',
      fr: 'Faible Valeur (<50M)',
      it: 'Basso Valore (<50M)',
      en: 'Low Value (<50M)',
      de: 'Niedriger Wert (<50M)'
    },
    selectTeam: {
      pt: 'Selecionar Equipa',
      es: 'Seleccionar Equipo',
      fr: 'Sélectionner l\'Équipe',
      it: 'Seleziona Squadra',
      en: 'Select Team',
      de: 'Team Auswählen'
    },
    confirmSelection: {
      pt: 'Confirmar Seleção',
      es: 'Confirmar Selección',
      fr: 'Confirmer la Sélection',
      it: 'Conferma Selezione',
      en: 'Confirm Selection',
      de: 'Auswahl Bestätigen'
    }
  },
  screens: {
    backToDashboard: {
      pt: 'Voltar ao Dashboard',
      es: 'Volver al Dashboard',
      fr: 'Retour au Tableau de Bord',
      it: 'Torna alla Dashboard',
      en: 'Back to Dashboard',
      de: 'Zurück zum Dashboard'
    },
    myTeam: {
      pt: 'A Minha Equipa',
      es: 'Mi Equipo',
      fr: 'Mon Équipe',
      it: 'La Mia Squadra',
      en: 'My Team',
      de: 'Mein Team'
    },
    mySquad: {
      pt: 'O Meu Plantel',
      es: 'Mi Plantilla',
      fr: 'Mon Effectif',
      it: 'La Mia Rosa',
      en: 'My Squad',
      de: 'Mein Kader'
    },
    totalPoints: {
      pt: 'Pontos Totais',
      es: 'Puntos Totales',
      fr: 'Points Totaux',
      it: 'Punti Totali',
      en: 'Total Points',
      de: 'Gesamtpunkte'
    },
    weeklyPoints: {
      pt: 'Pontos Semanais',
      es: 'Puntos Semanales',
      fr: 'Points Hebdomadaires',
      it: 'Punti Settimanali',
      en: 'Weekly Points',
      de: 'Wochenpunkte'
    },
    position: {
      pt: 'Posição',
      es: 'Posición',
      fr: 'Position',
      it: 'Posizione',
      en: 'Position',
      de: 'Position'
    },
    currentValue: {
      pt: 'Valor Atual',
      es: 'Valor Actual',
      fr: 'Valeur Actuelle',
      it: 'Valore Attuale',
      en: 'Current Value',
      de: 'Aktueller Wert'
    },
    budget: {
      pt: 'Orçamento',
      es: 'Presupuesto',
      fr: 'Budget',
      it: 'Budget',
      en: 'Budget',
      de: 'Budget'
    },
    usefulPoints: {
      pt: 'PtsTU',
      es: 'PtsTU',
      fr: 'PtsTU',
      it: 'PtsTU',
      en: 'Useful Points',
      de: 'PtsTU'
    },
    currentRatio: {
      pt: 'Rácio Atual',
      es: 'Ratio Actual',
      fr: 'Ratio Actuel',
      it: 'Rapporto Attuale',
      en: 'Current Ratio',
      de: 'Aktueller Quotient'
    },
    auctionedPlayers: {
      pt: 'Jogadores Leiloados',
      es: 'Jugadores Subastados',
      fr: 'Joueurs Aux Enchères',
      it: 'Giocatori all\'Asta',
      en: 'Auctioned Players',
      de: 'Versteigerte Spieler'
    },
    auctionedPlayersInfo: {
      pt: 'Cada jogador ganho em leilão pode ser usado uma vez. Enquanto não for usado, mantém-se como 24.º jogador e contribui com os seus PtsTU.',
      es: 'Cada jugador ganado en subasta puede usarse una vez. Mientras no se use, permanece como 24.º jugador y suma sus PtsTU.',
      fr: 'Chaque joueur gagné aux enchères peut être utilisé une fois. Tant qu\'il n\'est pas utilisé, il reste comme 24e joueur et ajoute ses PtsTU.',
      it: 'Ogni giocatore vinto all\'asta può essere usato una volta. Finché non viene usato, rimane come 24º giocatore e aggiunge i suoi PtsTU.',
      en: 'Each auctioned player can be used once. Until then, they stay as the 24th player and add their PtsTU.',
      de: 'Jeder ersteigerte Spieler kann einmal eingesetzt werden. Bis dahin bleibt er als 24. Spieler und zählt mit seinen PtsTU.'
    },
    markAsUsed: {
      pt: 'Marcar como usado',
      es: 'Marcar como usado',
      fr: 'Marquer comme utilisé',
      it: 'Segna come usato',
      en: 'Mark as used',
      de: 'Als benutzt markieren'
    },
    noAuctionedPlayers: {
      pt: 'Ainda não tens jogadores leiloados disponíveis.',
      es: 'Todavía no tienes jugadores subastados disponibles.',
      fr: 'Vous n\'avez pas encore de joueurs aux enchères disponibles.',
      it: 'Non hai ancora giocatori all\'asta disponibili.',
      en: 'You don\'t have any auctioned players available yet.',
      de: 'Du hast noch keine versteigerten Spieler verfügbar.'
    },
    selectYourTactic: {
      pt: 'Escolha a Sua Tática',
      es: 'Elige Tu Táctica',
      fr: 'Choisissez Votre Tactique',
      it: 'Scegli la Tua Tattica',
      en: 'Choose Your Tactic',
      de: 'Wähle Deine Taktik'
    },
    leaderboard: {
      pt: 'Classificação',
      es: 'Clasificación',
      fr: 'Classement',
      it: 'Classifica',
      en: 'Leaderboard',
      de: 'Rangliste'
    },
    rank: {
      pt: 'Classificação',
      es: 'Clasificación',
      fr: 'Rang',
      it: 'Posizione',
      en: 'Rank',
      de: 'Rang'
    },
    manager: {
      pt: 'Gestor',
      es: 'Manager',
      fr: 'Manager',
      it: 'Manager',
      en: 'Manager',
      de: 'Manager'
    },
    noPlayersYet: {
      pt: 'Ainda não tem jogadores selecionados',
      es: 'Aún no tienes jugadores seleccionados',
      fr: 'Vous n\'avez pas encore sélectionné de joueurs',
      it: 'Non hai ancora selezionato giocatori',
      en: 'No players selected yet',
      de: 'Noch keine Spieler ausgewählt'
    },
    selectPlayersFirst: {
      pt: 'Por favor, selecione os seus jogadores primeiro',
      es: 'Por favor, selecciona tus jugadores primero',
      fr: 'Veuillez d\'abord sélectionner vos joueurs',
      it: 'Per favore, seleziona prima i tuoi giocatori',
      en: 'Please select your players first',
      de: 'Bitte wähle zuerst deine Spieler aus'
    },
    elevenOfWeek: {
      pt: 'Eleven da Semana',
      es: 'Once de la Semana',
      fr: 'Onze de la Semaine',
      it: 'Undici della Settimana',
      en: 'Eleven of the Week',
      de: 'Elf der Woche'
    },
    selectYourEleven: {
      pt: 'Selecione o Seu 11 Inicial',
      es: 'Selecciona Tu 11 Inicial',
      fr: 'Sélectionnez Votre 11 Titulaire',
      it: 'Seleziona il Tuo 11 Iniziale',
      en: 'Select Your Starting 11',
      de: 'Wähle Deine Startelf'
    },
    playerAuction: {
      pt: 'Leilão de Jogadores',
      es: 'Subasta de Jugadores',
      fr: 'Enchères de Joueurs',
      it: 'Asta Giocatori',
      en: 'Player Auction',
      de: 'Spielerauktion'
    },
    topPlayers: {
      pt: 'Melhores Jogadores',
      es: 'Mejores Jugadores',
      fr: 'Meilleurs Joueurs',
      it: 'Migliori Giocatori',
      en: 'Top Players',
      de: 'Top-Spieler'
    },
    myLeague: {
      pt: 'A Minha Liga',
      es: 'Mi Liga',
      fr: 'Ma Ligue',
      it: 'La Mia Lega',
      en: 'My League',
      de: 'Meine Liga'
    },
    starters: {
      pt: 'Titulares',
      es: 'Titulares',
      fr: 'Titulaires',
      it: 'Titolari',
      en: 'Starters',
      de: 'Startelf'
    },
    substitutes: {
      pt: 'Suplentes',
      es: 'Suplentes',
      fr: 'Remplaçants',
      it: 'Riserve',
      en: 'Substitutes',
      de: 'Ersatzspieler'
    },
    availablePlayers: {
      pt: 'Jogadores Disponíveis',
      es: 'Jugadores Disponibles',
      fr: 'Joueurs Disponibles',
      it: 'Giocatori Disponibili',
      en: 'Available Players',
      de: 'Verfügbare Spieler'
    },
    currentBid: {
      pt: 'Licitação Atual',
      es: 'Oferta Actual',
      fr: 'Enchère Actuelle',
      it: 'Offerta Attuale',
      en: 'Current Bid',
      de: 'Aktuelles Gebot'
    },
    placeBid: {
      pt: 'Licitar',
      es: 'Ofertar',
      fr: 'Enchérir',
      it: 'Fai un\'Offerta',
      en: 'Place Bid',
      de: 'Bieten'
    },
    yourBalance: {
      pt: 'O Seu Saldo',
      es: 'Tu Saldo',
      fr: 'Votre Solde',
      it: 'Il Tuo Saldo',
      en: 'Your Balance',
      de: 'Dein Guthaben'
    },
    globalLeague: {
      pt: 'Liga Global',
      es: 'Liga Global',
      fr: 'Ligue Globale',
      it: 'Lega Globale',
      en: 'Global League',
      de: 'Globale Liga'
    },
    privateLeagues: {
      pt: 'Ligas Privadas',
      es: 'Ligas Privadas',
      fr: 'Ligues Privées',
      it: 'Leghe Private',
      en: 'Private Leagues',
      de: 'Private Ligen'
    },
    settings: {
      pt: 'Definições',
      es: 'Configuración',
      fr: 'Paramètres',
      it: 'Impostazioni',
      en: 'Settings',
      de: 'Einstellungen'
    },
    accountSettings: {
      pt: 'Definições da Conta',
      es: 'Configuración de Cuenta',
      fr: 'Paramètres du Compte',
      it: 'Impostazioni Account',
      en: 'Account Settings',
      de: 'Kontoeinstellungen'
    },
    currentPassword: {
      pt: 'Palavra-passe Atual',
      es: 'Contraseña Actual',
      fr: 'Mot de Passe Actuel',
      it: 'Password Attuale',
      en: 'Current Password',
      de: 'Aktuelles Passwort'
    },
    newPassword: {
      pt: 'Nova Palavra-passe',
      es: 'Nueva Contraseña',
      fr: 'Nouveau Mot de Passe',
      it: 'Nuova Password',
      en: 'New Password',
      de: 'Neues Passwort'
    },
    confirmPassword: {
      pt: 'Confirmar Palavra-passe',
      es: 'Confirmar Contraseña',
      fr: 'Confirmer le Mot de Passe',
      it: 'Conferma Password',
      en: 'Confirm Password',
      de: 'Passwort Bestätigen'
    },
    changePassword: {
      pt: 'Alterar Palavra-passe',
      es: 'Cambiar Contraseña',
      fr: 'Changer le Mot de Passe',
      it: 'Cambia Password',
      en: 'Change Password',
      de: 'Passwort Ändern'
    },
    passwordChanged: {
      pt: 'Palavra-passe alterada com sucesso!',
      es: '¡Contraseña cambiada con éxito!',
      fr: 'Mot de passe changé avec succès!',
      it: 'Password cambiata con successo!',
      en: 'Password changed successfully!',
      de: 'Passwort erfolgreich geändert!'
    },
    passwordMismatch: {
      pt: 'As palavras-passe não coincidem',
      es: 'Las contraseñas no coinciden',
      fr: 'Les mots de passe ne correspondent pas',
      it: 'Le password non corrispondono',
      en: 'Passwords do not match',
      de: 'Passwörter stimmen nicht überein'
    },
    manageAccount: {
      pt: 'Gerir a sua conta e preferências',
      es: 'Gestiona tu cuenta y preferencias',
      fr: 'Gérez votre compte et préférences',
      it: 'Gestisci il tuo account e le preferenze',
      en: 'Manage your account and preferences',
      de: 'Verwalte dein Konto und Einstellungen'
    }
  }
};

export function getTranslation(key: string, lang: Language): string {
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    value = value?.[k];
    if (!value) return key;
  }

  return value[lang] || value.en || key;
}
