export const metadata = {
  title: 'このサイトについて - Clap',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        このサイトについて
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-700 space-y-8 text-gray-800 dark:text-gray-200">
        
        <section>
          <p className="leading-relaxed">
            「Clap」は、Scratchの作品をより快適に閲覧・プレイするために作成された非公式の外部ビューワー（プレイヤー）です。
            以下の事項をご理解いただいた上でご利用ください。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
            1. コンテンツの取得と著作権について
          </h2>
          <p className="leading-relaxed text-sm md:text-base">
            当サイトに表示されているプロジェクト（ゲームやアニメーション等）、ユーザー情報、コメントなどのデータは、すべてScratch公式の公開APIを利用して自動的に取得・表示しているものです。<br />
            これらのコンテンツの著作権は、元のScratchユーザー（クリエイター）およびScratch財団に帰属します。当サイトがそれらの権利を侵害する意図は一切ありません。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
            2. 非表示（削除）対応について
          </h2>
          <p className="leading-relaxed text-sm md:text-base">
            当サイトは自動取得によってコンテンツを表示していますが、問題のある作品や、権利を侵害している作品を表示し続ける意図はありません。<br />
            もしご自身の作品が当サイトに表示されることを望まない場合や、ガイドラインに違反する不適切なコンテンツを発見した場合は、プロジェクト詳細ページにある<strong>「⚠️ このプロジェクトを報告する」</strong>ボタンからご連絡ください。確認次第、速やかに当サイト上での非表示（ブラックリスト追加）対応を行わせていただきます。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
            3. 非公式なサービスであること
          </h2>
          <p className="leading-relaxed text-sm md:text-base">
            当サイトは個人が開発・運営している非公式のWebサイトであり、MIT（マサチューセッツ工科大学）やScratch財団とは一切関係がありません。当サイトに関するお問い合わせをScratch公式に行うことはお控えください。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
            4. 免責事項
          </h2>
          <p className="leading-relaxed text-sm md:text-base">
            当サイトを利用したことによって生じた、いかなるトラブルや損害（データの消失、ユーザー間のトラブル、端末の不具合など）についても、運営者は一切の責任を負いかねます。すべてご自身の責任においてご利用ください。
          </p>
        </section>

      </div>
    </div>
  );
}