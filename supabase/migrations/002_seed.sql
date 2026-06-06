-- AffiBase Seed Data
-- Sample themes and offers for development

-- ─── Themes ───────────────────────────────────────────────────────────────────

INSERT INTO themes (name, slug, description, genre, monthly_searches, competition_level, avg_affiliate_price, aeo_potential, difficulty_score) VALUES
('副業診断サイト',       'fukugyou-shindan',   '会社員・主婦向けの副業マッチング診断サイト',       '副業',       250000, 'medium', 5000,  'high',   45),
('転職診断サイト',       'tenshoku-shindan',   '20〜40代向け転職タイミング・エージェント診断',     '転職',       320000, 'high',   15000, 'high',   60),
('AIツール活用診断',     'ai-tool-shindan',    'AIツール活用レベル診断と最適ツールレコメンド',     'AIツール',   180000, 'low',    8000,  'high',   35),
('フリーランス独立診断', 'freelance-shindan',  '会社員からフリーランスへの準備度・独立パス診断', '副業',       120000, 'medium', 8000,  'medium', 50),
('オンライン学習診断',   'learning-shindan',   'スキルアップに最適な学習サービス診断',           'オンライン学習', 95000, 'low', 3000, 'medium', 30);

-- ─── Sample Offers ─────────────────────────────────────────────────────────────

INSERT INTO offers (asp, external_id, name, description, genre, commission, approval_rate, epc, affiliate_url, product_url, logo_url) VALUES
('accesstrade', 'AT001', 'doda（デューダ）',            '業界最大級の転職サービス。求人数30万件以上',  '転職',  5000, 72.5, 85.0,  'https://affiliate.accesstrade.ne.jp/link/AT001', 'https://doda.jp',              NULL),
('accesstrade', 'AT002', 'リクルートエージェント',       '国内最大手の転職エージェント',                '転職',  8000, 68.0, 120.0, 'https://affiliate.accesstrade.ne.jp/link/AT002', 'https://r-agent.com',          NULL),
('a8',          'A8001', 'クラウドワークス',             'フリーランス案件数No.1のクラウドソーシング',  '副業',  2000, 81.0, 45.0,  'https://px.a8.net/A8001',                        'https://crowdworks.jp',        NULL),
('a8',          'A8002', 'ランサーズ',                   'デザイン・ライティング案件が豊富',            '副業',  1500, 79.5, 38.0,  'https://px.a8.net/A8002',                        'https://www.lancers.jp',       NULL),
('a8',          'A8003', 'Udemy（ユーデミー）',          'オンライン講座12万件以上。セール時1,500円〜',  'オンライン学習', 1200, 88.0, 25.0, 'https://px.a8.net/A8003', 'https://www.udemy.com/ja',     NULL),
('a8',          'A8004', 'ChatGPT Plus（via紹介）',      'GPT-4o搭載。月額3,000円〜の最強AIアシスタント', 'AIツール', 2500, 65.0, 55.0, 'https://px.a8.net/A8004', 'https://chat.openai.com',      NULL),
('a8',          'A8005', 'スキルハックス',               'フリーランス特化スキルアップ動画講座',        '副業',  3000, 74.0, 65.0,  'https://px.a8.net/A8005',                        'https://skillhacks.jp',        NULL),
('valuecommerce','VC001','マネーフォワードME',           '家計簿・資産管理アプリ No.1',                 '副業',  800,  90.0, 18.0,  'https://ck.jp.ap.valuecommerce.com/VC001',        'https://moneyforward.com/me/', NULL);

-- ─── Diagnosis Patterns for 副業診断サイト ──────────────────────────────────────

-- Get theme id
DO $$
DECLARE
  theme_uuid UUID;
  offer_cw   UUID;
  offer_la   UUID;
  offer_sh   UUID;
BEGIN
  SELECT id INTO theme_uuid FROM themes WHERE slug = 'fukugyou-shindan';
  SELECT id INTO offer_cw   FROM offers WHERE external_id = 'A8001';
  SELECT id INTO offer_la   FROM offers WHERE external_id = 'A8002';
  SELECT id INTO offer_sh   FROM offers WHERE external_id = 'A8005';

  INSERT INTO diagnosis_patterns (theme_id, pattern_key, result_title, result_description, result_icon, recommended_offers, aeo_faq) VALUES
  (theme_uuid,
   'time:1h,skill:writing,goal:30k',
   'Webライター副業タイプ',
   '1日1時間の隙間時間でも始められるWebライターが最適です。クラウドワークスやランサーズで案件を探しましょう。',
   '✍️',
   ARRAY[offer_cw, offer_la],
   '[{"q":"Webライターは初心者でも始められますか？","a":"はい。文章を書くのが好きであれば未経験から始められます。クラウドワークスで初心者向け案件を検索してみましょう。"},{"q":"Webライターの平均月収はいくらですか？","a":"初心者は月1〜3万円、慣れてくると月5〜10万円、専業になると月30万円以上も可能です。"}]'::jsonb),
  (theme_uuid,
   'time:2h,skill:design,goal:50k',
   'デザイナー副業タイプ',
   '2時間以上確保できるなら、デザインスキルを活かした高単価副業が狙えます。',
   '🎨',
   ARRAY[offer_cw, offer_sh],
   '[{"q":"デザイン副業に必要なスキルは何ですか？","a":"Figma・Canvaなどのツール操作と基本的なデザイン知識があれば始められます。スキルハックスで効率よく学べます。"},{"q":"デザイン副業の相場はいくらですか？","a":"バナー1枚3,000〜10,000円、LP制作で5〜30万円が一般的な相場です。"}]'::jsonb),
  (theme_uuid,
   'time:30m,skill:sns,goal:20k',
   'SNS運用代行タイプ',
   '毎日30分のSNS運用代行は、スキマ時間でコツコツ稼ぎたい方に最適です。',
   '📱',
   ARRAY[offer_cw, offer_la],
   '[{"q":"SNS運用代行は未経験でもできますか？","a":"自分のSNS運用経験があれば始められます。まずは個人アカウントで実績を作りましょう。"},{"q":"SNS運用代行の月収はいくらですか？","a":"初心者は1社月2〜5万円が目安。複数社担当すれば月15万円以上も可能です。"}]'::jsonb);
END $$;
