import { HelpCircle, Users, Target, Trophy, Calendar, Award, Gavel, DollarSign, Shield } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { getTutorialTranslation } from '../lib/tutorialTranslations';

interface TutorialProps {
  onBack: () => void;
}

function Tutorial({ onBack }: TutorialProps) {
  const { language } = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 text-white p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-center bg-no-repeat opacity-25 pointer-events-none"
        style={{
          backgroundImage: 'url(/Tutorial.png)',
          backgroundSize: '50%'
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <img src="/Tutorial.png" alt="Tutorial" className="w-12 h-12 md:w-16 md:h-16" />
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Tutorial
          </h1>
        </div>

        <div className="mb-6">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition-all"
          >
            {getTutorialTranslation('backToDashboard', language)}
          </button>
        </div>

        <div className="space-y-8">
          <section className="bg-black/40 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-cyan-400/30">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
              <h2 className="text-2xl md:text-3xl font-bold text-cyan-400">{getTutorialTranslation('howToPlay', language)}</h2>
            </div>
            <div className="space-y-4 text-base md:text-lg text-cyan-100">
              <p>
                {getTutorialTranslation('welcomeText', language)}
              </p>
              <p>
                {getTutorialTranslation('objectiveText', language)}
              </p>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-cyan-400/30">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
              <h2 className="text-2xl md:text-3xl font-bold text-cyan-400">{getTutorialTranslation('stepByStepGuide', language)}</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-cyan-900/30 rounded-xl p-4 md:p-6 border border-cyan-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-lg md:text-xl flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-cyan-300 mb-2 flex items-center gap-2 flex-wrap">
                      <Users className="w-5 h-5 md:w-6 md:h-6" />
                      {getTutorialTranslation('step1Title', language)}
                    </h3>
                    <p className="text-sm md:text-base text-cyan-100">
                      {getTutorialTranslation('step1Text', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-900/30 rounded-xl p-6 border border-cyan-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-xl flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-cyan-300 mb-2 flex items-center gap-2">
                      <Target className="w-6 h-6" />
                      {getTutorialTranslation('step2Title', language)}
                    </h3>
                    <p className="text-sm md:text-base text-cyan-100">
                      {getTutorialTranslation('step2Text', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-900/30 rounded-xl p-6 border border-cyan-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-xl flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-cyan-300 mb-2 flex items-center gap-2">
                      <Award className="w-6 h-6" />
                      {getTutorialTranslation('step3Title', language)}
                    </h3>
                    <p className="text-sm md:text-base text-cyan-100">
                      {getTutorialTranslation('step3Text', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-900/30 rounded-xl p-6 border border-cyan-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-xl flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-cyan-300 mb-2 flex items-center gap-2">
                      <Calendar className="w-6 h-6" />
                      {getTutorialTranslation('step4Title', language)}
                    </h3>
                    <p className="text-sm md:text-base text-cyan-100">
                      {getTutorialTranslation('step4Text', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-900/30 rounded-xl p-6 border border-cyan-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-xl flex-shrink-0">
                    5
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-cyan-300 mb-2 flex items-center gap-2">
                      <Gavel className="w-6 h-6" />
                      {getTutorialTranslation('step5Title', language)}
                    </h3>
                    <p className="text-sm md:text-base text-cyan-100">
                      {getTutorialTranslation('step5Text', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-900/30 rounded-xl p-6 border border-cyan-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-xl flex-shrink-0">
                    6
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-cyan-300 mb-2 flex items-center gap-2">
                      <Trophy className="w-6 h-6" />
                      {getTutorialTranslation('step6Title', language)}
                    </h3>
                    <p className="text-sm md:text-base text-cyan-100">
                      {getTutorialTranslation('step6Text', language)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-xl p-6 border border-cyan-400/30">
                <h3 className="text-xl font-bold text-cyan-300 mb-4">{getTutorialTranslation('videoTutorial', language)}</h3>
                <div className="aspect-video bg-black/50 rounded-lg flex items-center justify-center border border-cyan-500/30">
                  <div className="text-center">
                    <HelpCircle className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                    <p className="text-cyan-200">{getTutorialTranslation('videoComingSoon', language)}</p>
                    <p className="text-sm text-cyan-300/70 mt-2">{getTutorialTranslation('waitForUpdates', language)}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-cyan-400/30">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-8 h-8 text-cyan-400" />
              <h2 className="text-3xl font-bold text-cyan-400">{getTutorialTranslation('gameRules', language)}</h2>
            </div>

            <div className="space-y-4 text-cyan-100">
              <div className="bg-cyan-900/20 rounded-lg p-4 border border-cyan-500/20">
                <h3 className="font-bold text-cyan-300 mb-2">Seleção de Equipa</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Escolha uma equipa da Premier League ou Liga Portuguesa</li>
                  <li>A seleção é permanente até ao final da temporada (30 de junho)</li>
                  <li>Admins podem reselecionar equipas a qualquer momento</li>
                </ul>
              </div>

              <div className="bg-cyan-900/20 rounded-lg p-4 border border-cyan-500/20">
                <h3 className="font-bold text-cyan-300 mb-2">Seleção de Tática</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Pode alterar a tática uma vez por mês</li>
                  <li>Cada tática define o número de jogadores por posição</li>
                  <li>A tática influencia a formação dos seus 11 iniciais</li>
                </ul>
              </div>

              <div className="bg-cyan-900/20 rounded-lg p-4 border border-cyan-500/20">
                <h3 className="font-bold text-cyan-300 mb-2">Seleção de Jogadores</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Selecione 23 jogadores no total</li>
                  <li>Deve respeitar as posições da primeira tática escolhida</li>
                  <li>Pode alterar os jogadores (comprando e vendendo, mas sempre mantendo os 23) apenas na janela de transferências</li>
                  <li>Atenção aos preços depois atualizados dos jogadores</li>
                  <li>Todos os jogadores das Big Six estão disponíveis</li>
                </ul>
              </div>

              <div className="bg-cyan-900/20 rounded-lg p-4 border border-cyan-500/20">
                <h3 className="font-bold text-cyan-300 mb-2">Seleção dos 11 Iniciais</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Escolha semanalmente os 11 jogadores que vão pontuar</li>
                  <li>Os 11 devem seguir a tática escolhida e pontuam na totalidade</li>
                  <li>Os 5 suplentes contam apenas com metade dos pontos obtidos</li>
                </ul>
              </div>

              <div className="bg-cyan-900/20 rounded-lg p-4 border border-cyan-500/20">
                <h3 className="font-bold text-cyan-300 mb-2">Sistema de Pontos</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Golos marcados: +10 pontos (atacantes), +15 (médios), +20 (defesas/GR)</li>
                  <li>Assistências: +5 pontos</li>
                  <li>Jogos sem sofrer golos (clean sheets): +5 pontos (GR)</li>
                  <li>Cartões amarelos: -2 pontos</li>
                  <li>Cartões vermelhos: -5 pontos</li>
                  <li>Minutos jogados: +1 ponto por cada minuto multiplicado pelo resultado da equipa real (vitória x3, empate x1, derrota x0)</li>
                  <li>Exemplo: Vitinha joga 90 min e o PSG ganha = 90x3 = 270 pts; empata = 90 pts; perde = 0 pts (só contam golos/assistências)</li>
                </ul>
              </div>

              <div className="bg-cyan-900/20 rounded-lg p-4 border border-cyan-500/20">
                <h3 className="font-bold text-cyan-300 mb-2">Footledgers e Leilões</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Use Footledgers para licitar em jogadores exclusivos</li>
                  <li>Estes jogadores entrarão como 24º jogador apenas pelo tempo disponível assinalado no leilão</li>
                  <li>Precisa de 100 Footledgers para entrar em ligas privadas e um Dragon NFT verificado para criar uma liga</li>
                  <li>É necessário também ter Dragon NFT verificado para participar em leilões</li>
                  <li>Adquira Footledgers através da DAO1 ou DEX Apertum</li>
                </ul>
              </div>

              <div className="bg-cyan-900/20 rounded-lg p-4 border border-cyan-500/20">
                <h3 className="font-bold text-cyan-300 mb-2">Ligas</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Participe na liga global ou crie ligas privadas</li>
                  <li>Ligas privadas custam 100 Footledgers para entrar, mas é necessário ter um Dragon NFT para criar uma</li>
                  <li>Convide amigos com códigos de convite exclusivos</li>
                  <li>Compare pontuações e dispute o 1º lugar</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-cyan-400/30">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
              <h2 className="text-2xl md:text-3xl font-bold text-cyan-400">{getTutorialTranslation('faqTitle', language)}</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-cyan-900/20 rounded-lg p-4 md:p-5 border border-cyan-500/20">
                <h3 className="font-bold text-base md:text-lg text-cyan-300 mb-2">{getTutorialTranslation('faq1Question', language)}</h3>
                <p className="text-sm md:text-base text-cyan-100">{getTutorialTranslation('faq1Answer', language)}</p>
              </div>

              <div className="bg-cyan-900/20 rounded-lg p-4 md:p-5 border border-cyan-500/20">
                <h3 className="font-bold text-base md:text-lg text-cyan-300 mb-2">{getTutorialTranslation('faq2Question', language)}</h3>
                <p className="text-sm md:text-base text-cyan-100">{getTutorialTranslation('faq2Answer', language)}</p>
              </div>

              <div className="bg-cyan-900/20 rounded-lg p-4 md:p-5 border border-cyan-500/20">
                <h3 className="font-bold text-base md:text-lg text-cyan-300 mb-2">{getTutorialTranslation('faq3Question', language)}</h3>
                <p className="text-sm md:text-base text-cyan-100">{getTutorialTranslation('faq3Answer', language)}</p>
              </div>

              <div className="bg-cyan-900/20 rounded-lg p-4 md:p-5 border border-cyan-500/20">
                <h3 className="font-bold text-base md:text-lg text-cyan-300 mb-2">{getTutorialTranslation('faq4Question', language)}</h3>
                <p className="text-sm md:text-base text-cyan-100">{getTutorialTranslation('faq4Answer', language)}</p>
              </div>

              <div className="bg-cyan-900/20 rounded-lg p-4 md:p-5 border border-cyan-500/20">
                <h3 className="font-bold text-base md:text-lg text-cyan-300 mb-2">{getTutorialTranslation('faq5Question', language)}</h3>
                <p className="text-sm md:text-base text-cyan-100">{getTutorialTranslation('faq5Answer', language)}</p>
              </div>

              <div className="bg-cyan-900/20 rounded-lg p-4 md:p-5 border border-cyan-500/20">
                <h3 className="font-bold text-base md:text-lg text-cyan-300 mb-2">{getTutorialTranslation('faq6Question', language)}</h3>
                <p className="text-sm md:text-base text-cyan-100">{getTutorialTranslation('faq6Answer', language)}</p>
              </div>

              <div className="bg-cyan-900/20 rounded-lg p-4 md:p-5 border border-cyan-500/20">
                <h3 className="font-bold text-base md:text-lg text-cyan-300 mb-2">{getTutorialTranslation('faq7Question', language)}</h3>
                <p className="text-sm md:text-base text-cyan-100">{getTutorialTranslation('faq7Answer', language)}</p>
              </div>


              <div className="bg-cyan-900/20 rounded-lg p-4 md:p-5 border border-cyan-500/20">
                <h3 className="font-bold text-base md:text-lg text-cyan-300 mb-2">{getTutorialTranslation('faq8Question', language)}</h3>
                <p className="text-sm md:text-base text-cyan-100">{getTutorialTranslation('faq8Answer', language)}</p>
              </div>


              <div className="bg-cyan-900/20 rounded-lg p-4 md:p-5 border border-cyan-500/20">
                <h3 className="font-bold text-base md:text-lg text-cyan-300 mb-2">{getTutorialTranslation('faq9Question', language)}</h3>
                <p className="text-sm md:text-base text-cyan-100">{getTutorialTranslation('faq9Answer', language)}</p>
              </div>
            </div>
          </section>

          <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-2xl p-8 border border-cyan-400/30 text-center">
            <Shield className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-cyan-300 mb-4">{getTutorialTranslation('needMoreHelp', language)}</h2>
            <p className="text-cyan-100 mb-6">
              {getTutorialTranslation('needMoreHelpText', language)}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="https://lnkhub.app/House_of_Football_PT"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition-all inline-block"
              >
                {getTutorialTranslation('support', language)}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tutorial;
