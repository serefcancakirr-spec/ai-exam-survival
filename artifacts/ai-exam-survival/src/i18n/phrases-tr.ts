// Turkish texts for Smart Flashcards, Exam Calendar, AI Study Coach and Progress Tracker.
// Left side: the exact English text the app shows. Right side: what Turkish mode shows instead.
// {name} parts are filled in by the app; keep them exactly as they are on both sides.
// If an English text is missing here, the app simply shows the English text (nothing breaks).

const SHARED: Record<string, string> = {
  'Back to home': 'Ana sayfaya dön',
  'Return to the homepage': 'Ana sayfaya dön',
  'Saved on this device': 'Bu cihaza kaydedilir',
  Cancel: 'Vazgeç',
  Grade: 'Sınıf',
  Subject: 'Ders',
  Topic: 'Konu',
  '(optional)': '(isteğe bağlı)',
  Edit: 'Düzenle',
  Delete: 'Sil',
  Previous: 'Önceki',
  Next: 'Sonraki',
  Finish: 'Bitir',
  Reset: 'Sıfırla',
  'All grades': 'Tüm sınıflar',
  'All subjects': 'Tüm dersler',
  Today: 'Bugün',
  Tomorrow: 'Yarın',
  Yesterday: 'Dün',
};

const FLASHCARDS: Record<string, string> = {
  'Recall it, remember it': 'Hatırla, aklında tut',
  'Smart Flashcards': 'Akıllı Bilgi Kartları',
  'Make your own decks for grades 9–12, flip cards to check your recall, and let Review mode bring back the cards you find hardest.':
    '9–12. sınıflar için kendi destelerini oluştur, hatırladığını kontrol etmek için kartları çevir ve Tekrar modunun en çok zorlandığın kartları yeniden getirmesine izin ver.',
  'Browser saving is unavailable for flashcards': 'Bilgi kartları için tarayıcıya kaydetme kullanılamıyor',
  'Your cards and progress stay in this browser': 'Kartların ve ilerlemen bu tarayıcıda kalır',
  'AI Exam Survival · Smart Flashcards': 'AI Exam Survival · Akıllı Bilgi Kartları',
  'Saved flashcards could not be read, so they were left untouched. Changes on this visit will not be saved.':
    'Kayıtlı bilgi kartları okunamadı, bu yüzden hiç dokunulmadı. Bu ziyaretteki değişiklikler kaydedilmeyecek.',
  'This browser blocked saving. Your cards work for this visit but will not be kept.':
    'Bu tarayıcı kaydetmeyi engelledi. Kartların bu ziyarette çalışır ama saklanmaz.',
  'Deck name': 'Deste adı',
  'For example: Photosynthesis key words': 'Örneğin: Fotosentez anahtar kelimeleri',
  'For example: Cells & organelles': 'Örneğin: Hücre ve organeller',
  'Front · question or concept': 'Ön yüz · soru veya kavram',
  'For example: What does a ribosome do?': 'Örneğin: Ribozom ne işe yarar?',
  'Back · answer': 'Arka yüz · cevap',
  'For example: It builds proteins.': 'Örneğin: Protein üretir.',
  'Back · explanation': 'Arka yüz · açıklama',
  '(optional, helps you remember why)': '(isteğe bağlı, nedenini hatırlamana yardım eder)',
  'For example: Ribosomes follow instructions carried by mRNA.': 'Örneğin: Ribozomlar mRNA’nın taşıdığı talimatları izler.',
  'Check these details:': 'Şu bilgileri kontrol et:',
  'Check this card:': 'Bu kartı kontrol et:',
  'Card {number} of {total}': 'Kart {number} / {total}',
  'Choose a deck to start studying.': 'Çalışmaya başlamak için bir deste seç.',
  'Or create a new deck in your library above.': 'Ya da yukarıdaki kitaplığında yeni bir deste oluştur.',
  'This deck has no cards yet.': 'Bu destede henüz kart yok.',
  'Add your first card in “Cards in this deck” below.': 'İlk kartını aşağıdaki “Bu destedeki kartlar” bölümünden ekle.',
  'Nothing to review right now.': 'Şu an tekrar edilecek kart yok.',
  'Every card in this deck is mastered. Try Practice mode to test yourself again.':
    'Bu destedeki tüm kartları öğrendin. Kendini yeniden sınamak için Alıştırma modunu dene.',
  'Start Practice': 'Alıştırmaya başla',
  'This round has no cards left.': 'Bu turda kart kalmadı.',
  'Start a new round': 'Yeni tur başlat',
  '{mode} round complete': '{mode} turu tamamlandı',
  '{known} known · {again} to review': '{known} biliniyor · {again} tekrar edilecek',
  '{count} card skipped without a mark.': '{count} kart işaretlenmeden geçildi.',
  '{count} cards skipped without a mark.': '{count} kart işaretlenmeden geçildi.',
  'Go again': 'Yeniden başla',
  'Review cards that need work': 'Çalışılması gereken kartları tekrar et',
  'Marked: {mark}': 'İşaret: {mark}',
  'I know this': 'Biliyorum',
  'Review again': 'Tekrar et',
  'Show the front of the card': 'Kartın ön yüzünü göster',
  'Flip to see the answer': 'Cevabı görmek için çevir',
  Front: 'Ön yüz',
  'Tap to reveal the answer': 'Cevabı görmek için dokun',
  Answer: 'Cevap',
  'Tap to see the front again': 'Ön yüzü yeniden görmek için dokun',
  'Review Again': 'Tekrar Et',
  'I Know This': 'Biliyorum',
  'Flip the card first, then mark how you did.': 'Önce kartı çevir, sonra nasıl yaptığını işaretle.',
  'Previous card': 'Önceki kart',
  Shuffle: 'Karıştır',
  'Finish round': 'Turu bitir',
  'Next card': 'Sonraki kart',
  'You have been through the whole deck {count} times. Nice work.': 'Destenin tamamını {count} kez bitirdin. Harika iş.',
  'You have been through the whole deck. Nice work.': 'Destenin tamamını bitirdin. Harika iş.',
  'Your library': 'Kitaplığın',
  'Flashcard decks': 'Kart desteleri',
  'New deck': 'Yeni deste',
  'Create deck': 'Deste oluştur',
  'No decks match these filters.': 'Bu filtrelere uyan deste yok.',
  'Choose “All grades” and “All subjects”, or create a new deck.':
    '“Tüm sınıflar” ve “Tüm dersler”i seç ya da yeni bir deste oluştur.',
  Starter: 'Hazır',
  '{count} card': '{count} kart',
  '{count} cards': '{count} kart',
  '{mastered} mastered · {again} to review': '{mastered} öğrenildi · {again} tekrar edilecek',
  '{decks} deck · {cards} cards in your library': 'Kitaplığında {decks} deste · {cards} kart',
  '{decks} decks · {cards} cards in your library': 'Kitaplığında {decks} deste · {cards} kart',
  'Restore starter decks': 'Hazır desteleri geri getir',
  Study: 'Çalış',
  'No deck selected': 'Deste seçilmedi',
  'Study mode': 'Çalışma modu',
  Learn: 'Öğren',
  Practice: 'Alıştırma',
  Review: 'Tekrar',
  'Go through every card at your own pace. Flip, move back and forth, and mark what you know.':
    'Tüm kartları kendi hızında incele. Kartları çevir, ileri geri git ve bildiklerini işaretle.',
  'Test yourself on every card once, in a random order. Flip first, then mark honestly.':
    'Her kartta kendini bir kez, karışık sırayla sına. Önce çevir, sonra dürüstçe işaretle.',
  'Focus on cards that need work. Cards marked “Review again” come back more often; mastered cards rest.':
    'Çalışılması gereken kartlara odaklan. “Tekrar et” olarak işaretlenen kartlar daha sık gelir; öğrenilen kartlar dinlenir.',
  New: 'Yeni',
  Learning: 'Öğreniliyor',
  Mastered: 'Öğrenildi',
  'Deck progress': 'Deste ilerlemesi',
  'How you are doing': 'Nasıl gidiyorsun?',
  '“I Know This” moves a card up: New → Learning → Mastered. “Review Again” sends it back to Review again.':
    '“Biliyorum” kartı bir üst seviyeye taşır: Yeni → Öğreniliyor → Öğrenildi. “Tekrar Et” kartı yeniden Tekrar et seviyesine gönderir.',
  'Reset progress for every card in this deck?': 'Bu destedeki tüm kartların ilerlemesi sıfırlansın mı?',
  'Reset deck progress': 'Deste ilerlemesini sıfırla',
  'Choose a deck to see its progress.': 'İlerlemesini görmek için bir deste seç.',
  'Review tip': 'Tekrar ipucu',
  'Make recall active': 'Hatırlamayı aktif yap',
  'Try to answer before you flip the card. Pausing to recall the idea helps you notice what you know and what needs another review.':
    'Kartı çevirmeden önce cevaplamaya çalış. Durup bilgiyi hatırlamaya çalışmak, neyi bildiğini ve neyi yeniden tekrar etmen gerektiğini fark etmeni sağlar.',
  'Edit your deck': 'Desteni düzenle',
  'Cards in this deck': 'Bu destedeki kartlar',
  'Edit deck': 'Desteyi düzenle',
  'Delete deck': 'Desteyi sil',
  'Delete “{name}” and its {count} card? This cannot be undone.': '“{name}” ve içindeki {count} kart silinsin mi? Bu işlem geri alınamaz.',
  'Delete “{name}” and its {count} cards? This cannot be undone.': '“{name}” ve içindeki {count} kart silinsin mi? Bu işlem geri alınamaz.',
  'Save deck': 'Desteyi kaydet',
  'Add a card': 'Kart ekle',
  'Add card': 'Kartı ekle',
  'No cards yet. Your first card will appear here.': 'Henüz kart yok. İlk kartın burada görünecek.',
  'Save card': 'Kartı kaydet',
  'Edit card: {front}': 'Kartı düzenle: {front}',
  'Delete card: {front}': 'Kartı sil: {front}',
  'Delete this card and its progress?': 'Bu kart ve ilerlemesi silinsin mi?',
  'Delete card': 'Kartı sil',
  // messages
  '“{name}” was created. Add your first card below.': '“{name}” oluşturuldu. İlk kartını aşağıdan ekle.',
  'Deck details saved.': 'Deste bilgileri kaydedildi.',
  '“{name}” and its cards were deleted.': '“{name}” ve kartları silindi.',
  'Progress for this deck was reset. Every card is new again.': 'Bu destenin ilerlemesi sıfırlandı. Tüm kartlar yeniden yeni.',
  '{count} starter deck restored.': '{count} hazır deste geri getirildi.',
  '{count} starter decks restored.': '{count} hazır deste geri getirildi.',
  'All starter decks are already in your library.': 'Tüm hazır desteler zaten kitaplığında.',
  'Card added to this deck.': 'Kart bu desteye eklendi.',
  'Card updated.': 'Kart güncellendi.',
  'Card deleted.': 'Kart silindi.',
  'Cards shuffled. Starting from the first card.': 'Kartlar karıştırıldı. İlk karttan başlanıyor.',
  // checks (flashcards-model.ts)
  'Write the question or concept on the front.': 'Ön yüze soruyu veya kavramı yaz.',
  'Write the answer on the back.': 'Arka yüze cevabı yaz.',
  'Keep the front under {limit} characters.': 'Ön yüz {limit} karakteri geçmesin.',
  'Keep the answer under {limit} characters.': 'Cevap {limit} karakteri geçmesin.',
  'Keep the explanation under {limit} characters.': 'Açıklama {limit} karakteri geçmesin.',
  'Give the deck a name.': 'Desteye bir ad ver.',
  'Keep the deck name under {limit} characters.': 'Deste adı {limit} karakteri geçmesin.',
  'Choose a grade from 9 to 12.': '9 ile 12 arasında bir sınıf seç.',
  'Choose a subject.': 'Bir ders seç.',
  'Keep the topic under {limit} characters.': 'Konu {limit} karakteri geçmesin.',
};

const CALENDAR: Record<string, string> = {
  'Know what is coming': 'Neyin yaklaştığını bil',
  'Exam Calendar': 'Sınav Takvimi',
  'Add your real exams and see exactly how many days you have left. Past exams move out of the way on their own.':
    'Gerçek sınavlarını ekle ve kaç gün kaldığını tam olarak gör. Geçmiş sınavlar kendiliğinden kenara çekilir.',
  'Browser saving is unavailable for the calendar': 'Takvim için tarayıcıya kaydetme kullanılamıyor',
  'Your exams stay in this browser': 'Sınavların bu tarayıcıda kalır',
  'AI Exam Survival · Exam Calendar': 'AI Exam Survival · Sınav Takvimi',
  'Saved exams could not be read, so they were left untouched. Changes on this visit will not be saved.':
    'Kayıtlı sınavlar okunamadı, bu yüzden hiç dokunulmadı. Bu ziyaretteki değişiklikler kaydedilmeyecek.',
  'This browser blocked saving. Your exams work for this visit but will not be kept.':
    'Bu tarayıcı kaydetmeyi engelledi. Sınavların bu ziyarette çalışır ama saklanmaz.',
  'Saved preparation steps could not be read, so they were left untouched. New steps on this visit will not be saved.':
    'Kayıtlı hazırlık adımları okunamadı, bu yüzden hiç dokunulmadı. Bu ziyarette eklenen adımlar kaydedilmeyecek.',
  'This browser blocked saving. Preparation steps work for this visit but will not be kept.':
    'Bu tarayıcı kaydetmeyi engelledi. Hazırlık adımları bu ziyarette çalışır ama saklanmaz.',
  'Exam title': 'Sınav adı',
  'For example: Unit 3 test': 'Örneğin: 3. ünite sınavı',
  'Exam date': 'Sınav tarihi',
  'Start time': 'Başlangıç saati',
  'What it covers': 'Kapsadığı konular',
  'For example: Chapters 4–6, quadratic equations': 'Örneğin: 4–6. bölümler, ikinci dereceden denklemler',
  'Save exam': 'Sınavı kaydet',
  Prepare: 'Hazırlan',
  'Edit {title}': '{title} sınavını düzenle',
  'Delete {title}': '{title} sınavını sil',
  'Delete {title}?': '{title} silinsin mi?',
  'Delete “{title}”? This cannot be undone.': '“{title}” silinsin mi? Bu işlem geri alınamaz.',
  'Delete “{title}” and its {count} preparation step? This cannot be undone.':
    '“{title}” ve {count} hazırlık adımı silinsin mi? Bu işlem geri alınamaz.',
  'Delete “{title}” and its {count} preparation steps? This cannot be undone.':
    '“{title}” ve {count} hazırlık adımı silinsin mi? Bu işlem geri alınamaz.',
  'Delete exam': 'Sınavı sil',
  'Month view': 'Aylık görünüm',
  'Your exam month': 'Sınav ayın',
  'Today · {date}': 'Bugün · {date}',
  'Upcoming exams': 'Yaklaşan sınavlar',
  'Add exam': 'Sınav ekle',
  'No upcoming exams.': 'Yaklaşan sınav yok.',
  'Add your next exam to start the countdown.': 'Geri sayımı başlatmak için bir sonraki sınavını ekle.',
  'Or add three examples to see how the calendar works.': 'Ya da takvimin nasıl çalıştığını görmek için üç örnek ekle.',
  'Add your first exam': 'İlk sınavını ekle',
  'Add example exams': 'Örnek sınavlar ekle',
  'Past exams': 'Geçmiş sınavlar',
  'Exams move here automatically the day after they happen.': 'Sınavlar, yapıldıkları günün ertesinde otomatik olarak buraya taşınır.',
  'Next up': 'Sıradaki',
  'Nothing scheduled': 'Planlanmış sınav yok',
  'Add an exam to see your next countdown here.': 'Bir sonraki geri sayımını burada görmek için bir sınav ekle.',
  'Next 7 days': 'Önümüzdeki 7 gün',
  'Next 30 days': 'Önümüzdeki 30 gün',
  Upcoming: 'Yaklaşan',
  'Keep it manageable': 'Yönetilebilir tut',
  'One step per exam': 'Her sınav için bir adım',
  'Look at the next exam and pick one small preparation step for today: review flashcards for 20 minutes, or take a short practice quiz. Small steps every day beat one long night before.':
    'Bir sonraki sınavına bak ve bugün için küçük bir hazırlık adımı seç: 20 dakika bilgi kartlarını tekrar et ya da kısa bir alıştırma testi çöz. Her gün atılan küçük adımlar, sınavdan önceki uzun bir geceden daha etkilidir.',
  // countdowns and messages
  'In {days} days': '{days} gün sonra',
  '{days} days ago': '{days} gün önce',
  'Countdown: today.': 'Geri sayım: bugün.',
  'Countdown: tomorrow.': 'Geri sayım: yarın.',
  'Countdown: in {days} days.': 'Geri sayım: {days} gün sonra.',
  'This date has already passed, so it is in Past exams.': 'Bu tarih geçtiği için sınav Geçmiş sınavlar bölümünde.',
  '“{title}” added. {phrase}': '“{title}” eklendi. {phrase}',
  'Exam updated. {phrase}': 'Sınav güncellendi. {phrase}',
  '“{title}” was deleted.': '“{title}” silindi.',
  'Exam deleted.': 'Sınav silindi.',
  'Three example exams were added. Edit or delete them to make the calendar yours.':
    'Üç örnek sınav eklendi. Takvimi kendine göre düzenlemek için onları düzenle ya da sil.',
  // example exams (new data, written in the language in use)
  'Cell structure quiz': 'Hücre yapısı kısa sınavı',
  'Organelles and their jobs': 'Organeller ve görevleri',
  'Linear equations test': 'Doğrusal denklemler sınavı',
  'Solving equations, slope, graphs': 'Denklem çözme, eğim, grafikler',
  'Causes of World War I essay': 'Birinci Dünya Savaşı’nın nedenleri kompozisyonu',
  'Outline the main causes with evidence': 'Ana nedenleri kanıtlarıyla ana hatlarıyla yaz',
  // checks (exam-calendar-model.ts)
  'Write the exam title, for example “Unit 3 test”.': 'Sınavın adını yaz, örneğin “3. ünite sınavı”.',
  'Keep the exam title under {limit} characters.': 'Sınav adı {limit} karakteri geçmesin.',
  'Choose the exam date.': 'Sınav tarihini seç.',
  'Choose a real date from the calendar.': 'Takvimden gerçek bir tarih seç.',
  'Choose a date between {from} and {to}.': '{from} ile {to} arasında bir tarih seç.',
  'Choose a valid time, or leave the time empty.': 'Geçerli bir saat seç ya da saati boş bırak.',
  'Keep “what it covers” under {limit} characters.': '“Kapsadığı konular” {limit} karakteri geçmesin.',
  // month view
  '{count} exam this month': 'Bu ay {count} sınav',
  '{count} exams this month': 'Bu ay {count} sınav',
  'Previous month': 'Önceki ay',
  'Next month': 'Sonraki ay',
  ', today': ', bugün',
  'no exams': 'sınav yok',
  '{count} exam': '{count} sınav',
  '{count} exams': '{count} sınav',
  '+{count} more': '+{count} daha',
  'No exams on this day.': 'Bu günde sınav yok.',
  Preparation: 'Hazırlık',
  'Add an exam on this day': 'Bu güne sınav ekle',
  // preparation steps
  'Preparation progress': 'Hazırlık ilerlemesi',
  'Preparation steps': 'Hazırlık adımları',
  'No steps yet': 'Henüz adım yok',
  '{done} of {total} done · {percent}%': '{total} adımdan {done} tanesi bitti · %{percent}',
  'Add your own step below, or pick from the suggestions.': 'Aşağıya kendi adımını ekle ya da önerilerden seç.',
  Step: 'Adım',
  'Due date': 'Son tarih',
  'Save step': 'Adımı kaydet',
  'Edit step: {text}': 'Adımı düzenle: {text}',
  'Delete step: {text}': 'Adımı sil: {text}',
  'Add your own step': 'Kendi adımını ekle',
  'For example: Redo the chapter 4 exercises': 'Örneğin: 4. bölüm alıştırmalarını yeniden çöz',
  'Add step': 'Adım ekle',
  'This exam has passed, so there are no new suggestions.': 'Bu sınav geçtiği için yeni öneri yok.',
  'All added': 'Hepsi eklendi',
  'Add all ({count})': 'Hepsini ekle ({count})',
  Added: 'Eklendi',
  Add: 'Ekle',
  'Already added: {text}': 'Zaten eklendi: {text}',
  'Add step: {text}': 'Adım ekle: {text}',
  'Study Planner: {completed} of {planned} {subject} sessions done before this exam.':
    'Çalışma Planlayıcı: Bu sınavdan önceki {planned} {subject} oturumundan {completed} tanesi tamamlandı.',
  'Your Study Planner has no {subject} sessions before this exam yet.':
    'Çalışma Planlayıcında bu sınavdan önce henüz {subject} oturumu yok.',
  'You have not made a Study Planner week yet.': 'Henüz Çalışma Planlayıcı’da bir hafta oluşturmadın.',
  'Open Study Planner': 'Çalışma Planlayıcı’yı aç',
  'Suggested for an exam today': 'Bugünkü sınav için öneriler',
  'Suggested for an exam tomorrow': 'Yarınki sınav için öneriler',
  'Suggested for an exam in {days} days': '{days} gün sonraki sınav için öneriler',
  'Due today': 'Bugün yapılmalı',
  'Due tomorrow': 'Yarına kadar',
  'Due in {days} days': '{days} gün içinde',
  'Overdue by 1 day': '1 gün gecikti',
  'Overdue by {days} days': '{days} gün gecikti',
  'Write what you will do, for example “Review chapter 4”.': 'Ne yapacağını yaz, örneğin “4. bölümü tekrar et”.',
  'Keep the step under {limit} characters.': 'Adım {limit} karakteri geçmesin.',
  'Choose a real due date, or leave it empty.': 'Gerçek bir son tarih seç ya da boş bırak.',
  // suggestions (exam-prep-model.ts)
  'Quick 10-minute review of your key notes': 'Önemli notlarını 10 dakika hızlıca gözden geçir',
  'Pack what you need: pens, calculator, water': 'Gerekenleri hazırla: kalem, hesap makinesi, su',
  'Take three slow breaths before you start': 'Başlamadan önce üç kez yavaşça nefes al',
  'Review your {subject} flashcards for 20 minutes': '{subject} bilgi kartlarını 20 dakika tekrar et',
  'Take one short {subject} practice quiz': 'Kısa bir {subject} alıştırma testi çöz',
  'Re-read your summary notes and mark weak spots': 'Özet notlarını yeniden oku ve zayıf noktalarını işaretle',
  'Prepare your materials and sleep early': 'Malzemelerini hazırla ve erken uyu',
  'List every topic the exam covers': 'Sınavın kapsadığı tüm konuları listele',
  'Make or review {subject} flashcards for each topic': 'Her konu için {subject} bilgi kartları hazırla ya da tekrar et',
  'Take a practice quiz in {subject} and note your mistakes': '{subject} alıştırma testi çöz ve hatalarını not al',
  'Review the topics you got wrong': 'Yanlış yaptığın konuları tekrar et',
  'Final quick review the day before': 'Bir gün önce son hızlı tekrarı yap',
  'Plan {subject} study sessions in the Study Planner': 'Çalışma Planlayıcı’da {subject} çalışma oturumları planla',
  'Make {subject} flashcards for key terms': 'Önemli terimler için {subject} bilgi kartları hazırla',
  'Study one topic per session and tick it off': 'Her oturumda bir konu çalış ve işaretle',
  'Take a practice quiz in {subject} one week before': 'Bir hafta önce {subject} alıştırma testi çöz',
  'Review the topics you found hardest': 'En çok zorlandığın konuları tekrar et',
};

// ---------- AI Study Coach ----------
// Practice tasks appear both lower-case (inside a sentence) and capitalised (at the start of one).
const COACH_PRACTICE: Record<string, string> = {
  'solve 5 practice problems': '5 alıştırma problemi çöz',
  'label a diagram from memory': 'bir şemayı ezberden etiketle',
  'balance 5 equations or do 3 calculations': '5 denklemi denkleştir ya da 3 hesaplama yap',
  'solve 4 problems with units': 'birimleriyle 4 problem çöz',
  'write one PEEL paragraph': 'bir PEEL paragrafı yaz',
  'learn 3 short quotations': '3 kısa alıntı öğren',
  'write one paragraph with specific evidence': 'somut kanıtlar içeren bir paragraf yaz',
  'learn one case study': 'bir örnek olay incelemesi öğren',
  'use 5 new words in sentences': '5 yeni kelimeyi cümlelerde kullan',
  'answer 5 practice questions': '5 alıştırma sorusu cevapla',
};
const COACH_PRACTICE_BOTH: Record<string, string> = Object.fromEntries(
  Object.entries(COACH_PRACTICE).flatMap(([en, tr]) => [
    [en, tr],
    [en.charAt(0).toUpperCase() + en.slice(1), tr],
  ]),
);

const COACH: Record<string, string> = {
  ...COACH_PRACTICE_BOTH,
  // page
  'A supportive place to get unstuck': 'Takıldığın yerde destek alacağın bir yer',
  'AI Study Coach': 'Yapay Zekâ Çalışma Koçu',
  'Tell the coach your grade, subject, topic and exam date. You get a short, practical study plan with strategies that fit how hard the topic feels.':
    'Koça sınıfını, dersini, konunu ve sınav tarihini söyle. Konunun sana ne kadar zor geldiğine uygun stratejilerle kısa ve uygulanabilir bir çalışma planı al.',
  'Rule-based study advice · no live AI · nothing leaves this device':
    'Kurala dayalı çalışma önerileri · canlı yapay zekâ yok · hiçbir bilgi bu cihazdan çıkmaz',
  'AI Exam Survival · AI Study Coach': 'AI Exam Survival · Yapay Zekâ Çalışma Koçu',
  'Tell the coach': 'Koça anlat',
  'What are you studying?': 'Ne çalışıyorsun?',
  'Start from one of my exams': 'Sınavlarımdan biriyle başla',
  'Choose an exam from your calendar…': 'Takviminden bir sınav seç…',
  'For example: {topic}': 'Örneğin: {topic}',
  'For example: Chapter 4': 'Örneğin: 4. bölüm',
  'How hard does it feel?': 'Sana ne kadar zor geliyor?',
  'What gets in the way?': 'Seni en çok ne zorluyor?',
  'Start over': 'Baştan başla',
  'Get my study plan': 'Çalışma planımı oluştur',
  'Example plan': 'Örnek plan',
  'Your study plan': 'Çalışma planın',
  'Example · fill in the form for yours': 'Örnek · kendi planın için formu doldur',
  'Days left': 'Kalan gün',
  'Minutes a day': 'Günlük dakika',
  'Sessions a day': 'Günlük oturum',
  '{minutes}-minute session with a 5-minute break in between.': '{minutes} dakikalık oturum, araya 5 dakikalık mola.',
  '{minutes}-minute sessions with a 5-minute break in between.': '{minutes} dakikalık oturumlar, aralarında 5 dakikalık mola.',
  'Exam: {date}.': 'Sınav: {date}.',
  'Do these next': 'Sıradaki adımların',
  '{subject} strategies': '{subject} stratejileri',
  'Strategies that fit': 'Sana uygun stratejiler',
  'Why it works: {why}': 'Neden işe yarar: {why}',
  'A tip for your year': 'Sınıf düzeyine göre bir ipucu',
  'When you get stuck': 'Takıldığında',
  Optional: 'İsteğe bağlı',
  'Practise with a school-approved AI tool': 'Okulunun onayladığı bir yapay zekâ aracıyla pratik yap',
  'If your school allows an AI tool, copy this question into it. Only use tools your school approves, and never share personal information.':
    'Okulun bir yapay zekâ aracına izin veriyorsa bu soruyu kopyalayıp oraya yapıştır. Yalnızca okulunun onayladığı araçları kullan ve asla kişisel bilgilerini paylaşma.',
  'Practice question to copy': 'Kopyalanacak alıştırma sorusu',
  Copied: 'Kopyalandı',
  'Text selected. Press and hold to copy it.': 'Metin seçildi. Kopyalamak için basılı tut.',
  'Copy question': 'Soruyu kopyala',
  'Your last coaching request could not be read, so it was left untouched. New requests on this visit will not be saved.':
    'Son koçluk isteğin okunamadı, bu yüzden hiç dokunulmadı. Bu ziyaretteki yeni istekler kaydedilmeyecek.',
  'The exam date from your last visit has passed, so it was cleared. Add a new date for an updated plan.':
    'Önceki ziyaretindeki sınav tarihi geçtiği için temizlendi. Güncel bir plan için yeni bir tarih ekle.',
  'This browser blocked saving. The coach works for this visit but will not remember your request.':
    'Bu tarayıcı kaydetmeyi engelledi. Koç bu ziyarette çalışır ama isteğini hatırlamaz.',
  'Filled in from “{title}” in your Exam Calendar.': 'Sınav Takvimindeki “{title}” sınavına göre dolduruldu.',
  // checks (study-coach-model.ts)
  'Choose your grade (9–12).': 'Sınıfını seç (9–12).',
  'Choose how hard the topic feels.': 'Konunun sana ne kadar zor geldiğini seç.',
  'Choose what gets in the way, or “Not sure”.': 'Seni neyin zorladığını seç ya da “Emin değilim”i işaretle.',
  'Choose a real exam date, or leave it empty.': 'Gerçek bir sınav tarihi seç ya da boş bırak.',
  'That exam date has already passed. Choose a future date or leave it empty.': 'Bu sınav tarihi geçti. İleri bir tarih seç ya da boş bırak.',
  // labels
  Comfortable: 'Rahat',
  'Somewhat hard': 'Biraz zor',
  'Very hard': 'Çok zor',
  'Not sure / nothing specific': 'Emin değilim / özel bir sorun yok',
  'I don’t understand it': 'Konuyu anlamıyorum',
  'I understand it but forget it': 'Anlıyorum ama unutuyorum',
  'I run out of time in exams': 'Sınavlarda süre yetmiyor',
  'I get nervous in exams': 'Sınavlarda heyecanlanıyorum',
  'Grade {grade}': '{grade}. sınıf',
  'No exam date': 'Sınav tarihi yok',
  'Exam today': 'Sınav bugün',
  'Exam tomorrow': 'Sınav yarın',
  'Exam in {days} days': 'Sınava {days} gün var',
  'Open Smart Flashcards': 'Akıllı Bilgi Kartları’nı aç',
  'Open Quiz Center': 'Test Merkezi’ni aç',
  'Open Exam Calendar': 'Sınav Takvimi’ni aç',
  // focus sentences
  'Exam day: a calm, light review is all you need. Trust what you have practised.':
    'Sınav günü: sakin ve hafif bir tekrar yeterli. Çalıştıklarına güven.',
  'Exam day: review the key points once, then stop studying and get ready.':
    'Sınav günü: önemli noktaları bir kez gözden geçir, sonra çalışmayı bırak ve hazırlan.',
  'Exam day: focus on the few ideas you know best and how to start each type of question. No new material now.':
    'Sınav günü: en iyi bildiğin birkaç fikre ve her soru tipine nasıl başlayacağına odaklan. Şimdi yeni konu yok.',
  'With only a day or two left, keep it short: test yourself and polish small gaps.':
    'Yalnızca bir iki gün kaldı, kısa tut: kendini sına ve küçük eksikleri tamamla.',
  'With a day or two left, spend your time testing yourself on the parts you are least sure about.':
    'Bir iki gün kaldı; zamanını en az emin olduğun kısımlarda kendini sınayarak geçir.',
  'With a day or two left, aim for the core ideas that appear most often. Practise them until you can explain them.':
    'Bir iki gün kaldı; en sık çıkan temel fikirlere odaklan. Onları açıklayabilene kadar pratik yap.',
  'You have a week: keep your knowledge fresh with short daily practice.':
    'Bir haftan var: kısa günlük pratiklerle bilgini taze tut.',
  'You have a week: work through the topic part by part, then finish with practice questions.':
    'Bir haftan var: konuyu parça parça çalış, sonra alıştırma sorularıyla bitir.',
  'You have a week: start with the basics today, add one part each day, and save the last two days for practice.':
    'Bir haftan var: bugün temellerle başla, her gün bir kısım ekle ve son iki günü pratiğe ayır.',
  'You have a few weeks: a little practice every few days will keep this topic strong.':
    'Birkaç haftan var: birkaç günde bir yapacağın küçük pratikler bu konuyu sağlam tutar.',
  'You have a few weeks: plan regular sessions now so the last week is review, not catch-up.':
    'Birkaç haftan var: düzenli oturumları şimdiden planla ki son hafta yetişmeye değil tekrara kalsın.',
  'You have a few weeks, which is enough time if you start now and study a little every day.':
    'Birkaç haftan var; şimdi başlar ve her gün biraz çalışırsan bu süre yeterli.',
  'The exam is still far away: short weekly reviews will keep this topic fresh.':
    'Sınav daha uzakta: haftalık kısa tekrarlar bu konuyu taze tutar.',
  'The exam is still far away: build understanding slowly with short, spaced sessions.':
    'Sınav daha uzakta: kısa ve aralıklı oturumlarla konuyu yavaş yavaş kavra.',
  'The exam is still far away, which is good news: tackle the hardest parts first while there is time.':
    'Sınav daha uzakta, bu iyi haber: zaman varken önce en zor kısımlarla uğraş.',
  'No exam date yet: keep this topic fresh with a short session or two each week.':
    'Henüz sınav tarihi yok: her hafta bir iki kısa oturumla bu konuyu taze tut.',
  'No exam date yet: build steady understanding with short, regular sessions.':
    'Henüz sınav tarihi yok: kısa ve düzenli oturumlarla konuyu istikrarlı biçimde kavra.',
  'No exam date yet: start with the basics and study a little often instead of a lot at once.':
    'Henüz sınav tarihi yok: temellerle başla ve bir seferde çok yerine sık sık biraz çalış.',
  // actions
  'this topic': 'bu konu',
  '{count} session': '{count} oturum',
  '{count} sessions': '{count} oturum',
  'Two days before the exam': 'Sınavdan iki gün önce',
  'One week before the exam': 'Sınavdan bir hafta önce',
  'Spend {minutes} minutes on a light review of {phraseTopic}: your summary and key terms only.':
    '{phraseTopic} için {minutes} dakikalık hafif bir tekrar yap: yalnızca özetine ve anahtar terimlere bak.',
  'Test yourself on five quick questions. Do not start new material today.':
    'Beş kısa soruyla kendini sına. Bugün yeni konuya başlama.',
  'Get your things ready, eat, drink water and arrive early.': 'Eşyalarını hazırla, bir şeyler ye, su iç ve erken git.',
  'Close your notes and write everything you remember about {phraseTopic}. Then check and mark the gaps (15 min).':
    'Notlarını kapat ve {phraseTopic} hakkında hatırladığın her şeyi yaz. Sonra kontrol et ve eksikleri işaretle (15 dk).',
  '{phrasePractice} on the parts you missed (25 min).': 'Eksik kaldığın kısımlar için {phrasePractice} (25 dk).',
  'Review your flashcards for {phraseTopic} in Review mode.': '{phraseTopic} için hazırladığın bilgi kartlarını Tekrar modunda çalış.',
  '{phraseWhen}, take a {subject} practice quiz and look at every mistake.':
    '{phraseWhen} bir {subject} alıştırma testi çöz ve her hatana tek tek bak.',
  '{phraseWhen}, answer practice questions without notes and check every mistake.':
    '{phraseWhen} notlarına bakmadan alıştırma soruları çöz ve her hatanı kontrol et.',
  'List the parts of {phraseTopic} the exam covers and mark the hardest ones.':
    'Sınavın {phraseTopic} ile ilgili kapsadığı kısımları listele ve en zorlarını işaretle.',
  'Study {phraseSessions} a day, one part per session: {phrasePractice}.':
    'Günde {phraseSessions} çalış, her oturumda bir kısım: {phrasePractice}.',
  'Make flashcards for {phraseTopic} and review them every day.': '{phraseTopic} için bilgi kartları hazırla ve her gün tekrar et.',
  'Plan {phraseSessions} a day in the Study Planner.': 'Çalışma Planlayıcı’da günde {phraseSessions} planla.',
  'Learn {phraseTopic} one part at a time: {phrasePractice} in each session.':
    '{phraseTopic} için her seferinde bir kısım öğren; her oturumda: {phrasePractice}.',
  'Make flashcards as you go and review them every few days.': 'İlerledikçe bilgi kartları hazırla ve birkaç günde bir tekrar et.',
  'Study {phraseTopic} in short sessions two or three times a week, not all at once.':
    '{phraseTopic} için haftada iki üç kez kısa oturumlarla çalış; hepsini bir seferde yapma.',
  '{phrasePractice} at the end of each session to check you understood.':
    'Anladığını kontrol etmek için her oturumun sonunda: {phrasePractice}.',
  'Make flashcards for the key ideas in {phraseTopic}.': '{phraseTopic} ile ilgili temel fikirler için bilgi kartları hazırla.',
  'Add the exam to the Exam Calendar when you know the date, so the countdown can guide you.':
    'Tarihi öğrenince sınavı Sınav Takvimi’ne ekle; geri sayım sana yol göstersin.',
  'Study {phraseTopic} in short sessions two or three times a week.': '{phraseTopic} için haftada iki üç kez kısa oturumlarla çalış.',
  '{phrasePractice} to check your understanding.': 'Anladığını kontrol etmek için: {phrasePractice}.',
  'Start with the basics of {phraseTopic}: find one worked example or ask your teacher which part matters most.':
    '{phraseTopic} için temellerden başla: çözümlü bir örnek bul ya da öğretmenine en önemli kısmın hangisi olduğunu sor.',
  'Challenge yourself: try the hardest {subject} question you can find on {phraseTopic}.':
    'Kendini zorla: {phraseTopic} hakkında bulabildiğin en zor {subject} sorusunu çözmeyi dene.',
  'Challenge yourself: try the hardest question you can find on {phraseTopic}.':
    'Kendini zorla: {phraseTopic} hakkında bulabildiğin en zor soruyu çözmeyi dene.',
  // practice question for an approved AI tool
  'my current topic': 'şu an işlediğim konu',
  'I am a grade {grade} student studying {phraseTopic} in {subject}. {phraseAsk}':
    'Ben {grade}. sınıf öğrencisiyim. {subject} dersinde şu konuyu çalışıyorum: {phraseTopic}. {phraseAsk}',
  'I am a grade {grade} student studying {phraseTopic}. {phraseAsk}':
    'Ben {grade}. sınıf öğrencisiyim. Şu konuyu çalışıyorum: {phraseTopic}. {phraseAsk}',
  'I am a grade {grade} student studying my current topic in {subject}. {phraseAsk}':
    'Ben {grade}. sınıf öğrencisiyim ve {subject} dersinde şu an işlediğimiz konuyu çalışıyorum. {phraseAsk}',
  'I am a grade {grade} student studying my current topic. {phraseAsk}':
    'Ben {grade}. sınıf öğrencisiyim ve şu an derste işlediğimiz konuyu çalışıyorum. {phraseAsk}',
  'Explain the main ideas in plain language, then give me 3 practice questions. Show the answers only after I try.':
    'Ana fikirleri sade bir dille açıkla, sonra bana 3 alıştırma sorusu ver. Cevapları ancak ben denedikten sonra göster.',
  'Explain it in plain language with one simple example, then check my understanding with 2 short questions.':
    'Konuyu basit bir örnekle sade bir dille açıkla, sonra 2 kısa soruyla anlayıp anlamadığımı kontrol et.',
  'Give me 5 quick recall questions to test my memory. Show the answers only after I try.':
    'Hafızamı sınamak için bana 5 kısa hatırlama sorusu sor. Cevapları ancak ben denedikten sonra göster.',
  'Give me one exam-style question with a time limit, then show me how to plan the answer quickly.':
    'Bana süre sınırı olan sınav tarzında bir soru ver, sonra cevabı hızlıca nasıl planlayacağımı göster.',
  'Give me 3 exam-style questions of increasing difficulty so I can practise calmly, with hints if I get stuck.':
    'Sakin bir şekilde pratik yapabilmem için giderek zorlaşan 3 sınav tarzı soru ver; takılırsam ipucu ver.',
  // grade and problem tips
  'Grade 9 is the best time to build habits. Short, regular sessions now make the later years much easier.':
    '9. sınıf alışkanlık kazanmak için en iyi zaman. Şimdi yapacağın kısa ve düzenli oturumlar sonraki yılları çok kolaylaştırır.',
  'In grade 10, topics start to connect. When something new feels hard, check which earlier topic it builds on.':
    '10. sınıfta konular birbirine bağlanmaya başlar. Yeni bir şey zor geldiğinde, hangi eski konunun üzerine kurulduğuna bak.',
  'Grade 11 has more exams close together. Start revising a week earlier than feels necessary, and use past questions often.':
    '11. sınıfta sınavlar birbirine daha yakındır. Tekrara gerekli gördüğünden bir hafta önce başla ve çıkmış soruları sık kullan.',
  'In grade 12, practise full past papers under timed conditions and focus your time on the topics that earn the most marks.':
    '12. sınıfta çıkmış sınavların tamamını süre tutarak çöz ve zamanını en çok puan getiren konulara ayır.',
  'Start with a quick self-test: the questions you miss show you where to spend your time.':
    'Kısa bir öz değerlendirmeyle başla: yanlış yaptığın sorular zamanını nereye ayırman gerektiğini gösterir.',
  'Find one worked example, explain each step in your own words, and write down one specific question to ask your teacher.':
    'Çözümlü bir örnek bul, her adımı kendi cümlelerinle açıkla ve öğretmenine sormak için net bir soru yaz.',
  'Test yourself instead of re-reading: close your notes, recall, then check. Repeat after one day, three days and one week.':
    'Tekrar okumak yerine kendini sına: notlarını kapat, hatırla, sonra kontrol et. Bir gün, üç gün ve bir hafta sonra tekrarla.',
  'Before you start a timed question, decide how many minutes it deserves based on its marks, and move on when the time is up.':
    'Süreli bir soruya başlamadan önce puanına göre kaç dakika ayıracağına karar ver ve süre dolunca bir sonrakine geç.',
  'Practise under exam conditions so the real exam feels familiar, and try slow breathing: in for 4, hold for 4, out for 4. If worry feels too big, talk to a teacher or your school counsellor.':
    'Gerçek sınav tanıdık gelsin diye sınav koşullarında pratik yap ve yavaş nefes almayı dene: 4 saniye al, 4 saniye tut, 4 saniye ver. Kaygın çok büyük geliyorsa bir öğretmenle ya da okulunun rehber öğretmeniyle konuş.',
  // topic ideas
  'Linear equations': 'Doğrusal denklemler',
  'Quadratic equations': 'İkinci dereceden denklemler',
  'Functions and graphs': 'Fonksiyonlar ve grafikler',
  'Geometry and angles': 'Geometri ve açılar',
  Trigonometry: 'Trigonometri',
  'Probability and statistics': 'Olasılık ve istatistik',
  'Cells and organelles': 'Hücreler ve organeller',
  'Genetics and DNA': 'Genetik ve DNA',
  Photosynthesis: 'Fotosentez',
  Respiration: 'Solunum',
  Ecology: 'Ekoloji',
  'Human body systems': 'İnsan vücudu sistemleri',
  'Atomic structure': 'Atomun yapısı',
  'Chemical bonding': 'Kimyasal bağlar',
  'The mole': 'Mol kavramı',
  'Balancing equations': 'Denklem denkleştirme',
  'Acids and bases': 'Asitler ve bazlar',
  'Rates of reaction': 'Tepkime hızları',
  'Forces and motion': 'Kuvvet ve hareket',
  'Energy and work': 'Enerji ve iş',
  Electricity: 'Elektrik',
  Waves: 'Dalgalar',
  Magnetism: 'Manyetizma',
  Pressure: 'Basınç',
  'Reading comprehension': 'Okuduğunu anlama',
  'Essay writing': 'Kompozisyon yazma',
  'Grammar and punctuation': 'Dil bilgisi ve noktalama',
  Vocabulary: 'Kelime bilgisi',
  'Persuasive writing': 'İkna edici yazma',
  'Summary writing': 'Özet yazma',
  Themes: 'Temalar',
  Characters: 'Karakterler',
  'Poetry analysis': 'Şiir çözümlemesi',
  Context: 'Bağlam',
  'Language and imagery': 'Dil ve imgeler',
  'Essay planning': 'Kompozisyon planlama',
  'Causes of World War I': 'Birinci Dünya Savaşı’nın nedenleri',
  'The Cold War': 'Soğuk Savaş',
  'The Industrial Revolution': 'Sanayi Devrimi',
  'The Ottoman Empire': 'Osmanlı İmparatorluğu',
  Revolutions: 'Devrimler',
  'Source analysis': 'Kaynak analizi',
  'Rivers and coasts': 'Akarsular ve kıyılar',
  'Plate tectonics': 'Levha tektoniği',
  'Weather and climate': 'Hava durumu ve iklim',
  Population: 'Nüfus',
  Urbanisation: 'Kentleşme',
  'Map and data skills': 'Harita ve veri becerileri',
  'Verb tenses': 'Fiil zamanları',
  Listening: 'Dinleme',
  Speaking: 'Konuşma',
  Reading: 'Okuma',
  Writing: 'Yazma',
};

// Strategies: title, how and why (study-coach-content.ts).
const COACH_STRATEGIES: Record<string, string> = {
  // Mathematics
  'Worked example, then a twin problem': 'Önce çözümlü örnek, sonra benzer soru',
  'Study one solved example line by line, cover it, then solve a similar problem on your own.':
    'Çözümlü bir örneği satır satır incele, üstünü kapat ve benzer bir soruyu kendi başına çöz.',
  'Copying the structure first and then working alone builds the method step by step.':
    'Önce yapıyı takip edip sonra tek başına çalışmak, yöntemi adım adım oturtur.',
  'Mixed practice set': 'Karışık alıştırma seti',
  'Do 6–8 problems from different topics in one session instead of one type in a row.':
    'Tek tip soruyu art arda çözmek yerine bir oturumda farklı konulardan 6–8 soru çöz.',
  'Mixing trains you to choose the right method, just like in the exam.':
    'Karışık çalışmak, tıpkı sınavdaki gibi doğru yöntemi seçmeyi öğretir.',
  'Mistake log': 'Hata defteri',
  'For every wrong answer, write what went wrong and the correct step. Retry those problems two days later.':
    'Her yanlış cevap için neyin yanlış gittiğini ve doğru adımı yaz. Bu soruları iki gün sonra yeniden çöz.',
  'Most lost marks come from the same few mistakes repeated.': 'Kaybedilen puanların çoğu, tekrarlanan aynı birkaç hatadan gelir.',
  'Timed problem sets': 'Süreli soru setleri',
  'Set a timer for 10 minutes and do as many problems as you can, then check every answer.':
    '10 dakikalık bir sayaç kur, çözebildiğin kadar soru çöz, sonra her cevabı kontrol et.',
  'Practising under time pressure makes exam timing feel normal.': 'Süre baskısı altında pratik yapmak, sınavdaki süreyi olağan hissettirir.',
  // Biology
  'Draw and label from memory': 'Ezberden çiz ve etiketle',
  'Sketch the diagram (a cell, the heart, a leaf) without notes, label it, then check and correct in another colour.':
    'Şemayı (bir hücre, kalp, bir yaprak) notlara bakmadan çiz, etiketle, sonra kontrol edip başka bir renkle düzelt.',
  'Drawing from memory shows exactly which parts you have not learned yet.': 'Ezberden çizmek, henüz hangi kısımları öğrenmediğini tam olarak gösterir.',
  'Turn a process into steps': 'Süreci adımlara ayır',
  'Write a process (mitosis, photosynthesis) as a numbered flowchart with one short line per step.':
    'Bir süreci (mitoz, fotosentez) her adım için kısa bir satır olacak şekilde numaralı bir akış şeması olarak yaz.',
  'Biology processes are easier to understand when you see the order.': 'Biyolojideki süreçler, sırasını gördüğünde daha kolay anlaşılır.',
  'Key-term flashcards': 'Anahtar terim kartları',
  'Make a flashcard for each key word and use Review mode until every card is mastered.':
    'Her anahtar kelime için bir bilgi kartı hazırla ve tüm kartları öğrenene kadar Tekrar modunu kullan.',
  'Exam answers need the exact scientific words.': 'Sınav cevapları tam bilimsel terimleri gerektirir.',
  'Exam questions with keywords': 'Anahtar kelimelerle sınav soruları',
  'Answer two exam-style questions, then compare with the mark scheme and underline the keywords you missed.':
    'Sınav tarzında iki soru cevapla, sonra cevap anahtarıyla karşılaştır ve kaçırdığın anahtar kelimelerin altını çiz.',
  'Marks are given for specific terms, so practise using them.': 'Puanlar belirli terimler için verilir, bu yüzden onları kullanma pratiği yap.',
  // Chemistry
  'Calculation template': 'Hesaplama şablonu',
  'For each calculation write: what you know, the formula, the numbers with units, the answer with units.':
    'Her hesaplama için şunları yaz: bildiklerin, formül, birimleriyle sayılar ve birimiyle cevap.',
  'A fixed layout prevents most calculation mistakes and earns method marks.': 'Sabit bir düzen, hesaplama hatalarının çoğunu önler ve yöntem puanı kazandırır.',
  'Equation drills': 'Denklem alıştırmaları',
  'Balance five equations in a row, then check by counting atoms on both sides.':
    'Art arda beş denklemi denkleştir, sonra iki taraftaki atomları sayarak kontrol et.',
  'Balancing becomes fast and automatic with short, regular practice.': 'Kısa ve düzenli pratikle denkleştirme hızlı ve otomatik hâle gelir.',
  'Explain with particles': 'Taneciklerle açıkla',
  'For each observation (fizzing, colour change), write one sentence about what the particles are doing.':
    'Her gözlem için (köpürme, renk değişimi) taneciklerin ne yaptığını anlatan bir cümle yaz.',
  'Linking what you see to particles is how chemistry is explained in exams.': 'Sınavlarda kimya, gördüklerini taneciklerle ilişkilendirerek açıklanır.',
  'Formula and ion flashcards': 'Formül ve iyon kartları',
  'Make flashcards for formulas, ion charges and symbols. Do one short round every day.':
    'Formüller, iyon yükleri ve semboller için bilgi kartları hazırla. Her gün kısa bir tur yap.',
  'Small daily reviews stop facts from fading.': 'Küçük günlük tekrarlar bilgilerin unutulmasını önler.',
  // Physics
  'Given → Find → Equation → Solve': 'Verilen → İstenen → Denklem → Çözüm',
  'Write what is given, what you must find, the equation, then substitute and solve with units.':
    'Verilenleri, bulman gerekeni ve denklemi yaz; sonra değerleri yerine koyup birimleriyle çöz.',
  'A clear routine stops you freezing on long problems.': 'Net bir rutin, uzun sorularda takılıp kalmanı önler.',
  'Formula sheet from memory': 'Ezberden formül listesi',
  'Write every formula you need, with what each letter means and its unit. Check and fix the gaps.':
    'Gereken her formülü, her harfin anlamı ve birimiyle birlikte yaz. Kontrol et ve eksikleri tamamla.',
  'You cannot use a formula you cannot remember.': 'Hatırlamadığın bir formülü kullanamazsın.',
  'Sketch it first': 'Önce çiz',
  'Before calculating, draw a quick diagram with arrows for forces or a simple circuit.':
    'Hesaplamadan önce kuvvetleri oklarla gösteren ya da basit bir devre içeren hızlı bir şema çiz.',
  'A sketch turns words into something you can reason about.': 'Bir çizim, kelimeleri üzerinde düşünebileceğin bir şeye dönüştürür.',
  'Do 4 problems in 12 minutes, then mark them and redo any you missed.':
    '12 dakikada 4 soru çöz, sonra kontrol et ve yanlış yaptıklarını yeniden çöz.',
  'Builds speed while keeping accuracy.': 'Doğruluğu korurken hız kazandırır.',
  // English
  'PEEL paragraphs': 'PEEL paragrafları',
  'Write each paragraph as Point, Evidence, Explain, Link. Highlight each part in a different colour.':
    'Her paragrafı Fikir, Kanıt, Açıklama, Bağlantı (Point, Evidence, Explain, Link) olarak yaz. Her bölümü farklı bir renkle işaretle.',
  'A clear structure makes answers easier to write and to mark.': 'Net bir yapı, cevapları yazmayı ve değerlendirmeyi kolaylaştırır.',
  'Active reading': 'Aktif okuma',
  'Read a short text and write a one-line summary next to each paragraph.': 'Kısa bir metin oku ve her paragrafın yanına bir satırlık özet yaz.',
  'Summarising forces you to understand, not just read.': 'Özetlemek seni sadece okumaya değil, anlamaya zorlar.',
  'Words in your own sentences': 'Kelimeleri kendi cümlelerinde kullan',
  'Pick 5 new words and use each one in a sentence about your own life.': '5 yeni kelime seç ve her birini kendi hayatınla ilgili bir cümlede kullan.',
  'Using a word yourself makes it stick far better than reading it.': 'Bir kelimeyi kendin kullanmak, onu okumaktan çok daha kalıcı hâle getirir.',
  '20-minute timed writing': '20 dakikalık süreli yazma',
  'Spend 5 minutes planning and 15 minutes writing an answer to a past question.':
    'Çıkmış bir soru için 5 dakika plan yap ve 15 dakika cevap yaz.',
  'Planning quickly is the skill that saves time in the exam.': 'Hızlı plan yapmak, sınavda zaman kazandıran beceridir.',
  // Literature
  'Quote bank': 'Alıntı bankası',
  'Choose 3–5 short quotations for each main theme or character and write what each one shows.':
    'Her ana tema ya da karakter için 3–5 kısa alıntı seç ve her birinin neyi gösterdiğini yaz.',
  'Short quotations are easy to remember and strong as evidence.': 'Kısa alıntılar kolay hatırlanır ve güçlü birer kanıttır.',
  'Theme map': 'Tema haritası',
  'Draw a mind map linking characters, key events and themes on one page.':
    'Karakterleri, önemli olayları ve temaları tek sayfada birbirine bağlayan bir zihin haritası çiz.',
  'Seeing the links helps you answer any question angle.': 'Bağlantıları görmek, soru hangi açıdan gelirse gelsin cevaplamana yardım eder.',
  'Three different openings': 'Üç farklı giriş',
  'For one essay question, write three different one-sentence arguments, then pick the strongest.':
    'Bir kompozisyon sorusu için üç farklı tek cümlelik görüş yaz, sonra en güçlüsünü seç.',
  'A clear argument at the start shapes the whole essay.': 'Başta net bir görüş, tüm kompozisyonu şekillendirir.',
  '10-minute essay plans': '10 dakikalık kompozisyon planları',
  'Plan (do not write) an essay in 10 minutes: argument, three points, a quote for each.':
    'Bir kompozisyonu 10 dakikada planla (yazma): görüş, üç nokta ve her biri için bir alıntı.',
  'Fast planning is what makes timed essays manageable.': 'Süreli kompozisyonları yönetilebilir kılan şey hızlı plan yapmaktır.',
  // History
  'Timeline from memory': 'Ezberden zaman çizelgesi',
  'Draw a timeline of the key dates and events without notes, then check and add what you missed.':
    'Önemli tarih ve olayların zaman çizelgesini notlara bakmadan çiz, sonra kontrol et ve kaçırdıklarını ekle.',
  'Order and dates hold the whole topic together.': 'Sıra ve tarihler tüm konuyu bir arada tutar.',
  'Cause-and-effect chains': 'Neden-sonuç zincirleri',
  'For one event, write the causes on the left and the consequences on the right, joined by arrows.':
    'Bir olay için nedenleri sola, sonuçları sağa yaz ve oklarla birbirine bağla.',
  'Most history questions ask why something happened or what it led to.': 'Tarih sorularının çoğu bir şeyin neden olduğunu ya da neye yol açtığını sorar.',
  'Source questions': 'Kaynak soruları',
  'For a source, note who made it, when, why, and how useful it is for the question.':
    'Bir kaynak için onu kimin, ne zaman ve neden oluşturduğunu ve soru için ne kadar yararlı olduğunu not et.',
  'This four-part check gives a clear, well-marked answer.': 'Bu dört parçalı kontrol, net ve yüksek puan alan bir cevap sağlar.',
  'Evidence-first paragraphs': 'Önce kanıt paragrafları',
  'Write a paragraph that names at least two specific facts (names, dates, numbers).':
    'En az iki somut bilgi (isimler, tarihler, sayılar) içeren bir paragraf yaz.',
  'Specific evidence is what lifts an answer to the top marks.': 'Bir cevabı en yüksek puana taşıyan şey somut kanıttır.',
  // Geography
  'Case-study cards': 'Örnek olay kartları',
  'Make one card per case study: place, key facts and figures, causes, impacts, responses.':
    'Her örnek olay için bir kart hazırla: yer, temel bilgiler ve sayılar, nedenler, etkiler, alınan önlemler.',
  'Named places and numbers turn general answers into strong ones.': 'Yer adları ve sayılar genel cevapları güçlü cevaplara dönüştürür.',
  'Sketch and label processes': 'Süreçleri çiz ve etiketle',
  'Draw a simple labelled sketch of a process, such as how a meander or volcano forms.':
    'Bir menderesin ya da yanardağın nasıl oluştuğu gibi bir sürecin basit, etiketli bir çizimini yap.',
  'Processes are easier to explain once you can draw them.': 'Süreçleri çizebildiğinde açıklamak daha kolaydır.',
  'Describe the data': 'Veriyi betimle',
  'For a graph or map, describe the overall pattern, quote two numbers, and name one exception.':
    'Bir grafik ya da harita için genel eğilimi anlat, iki sayı belirt ve bir istisnayı adlandır.',
  'This is exactly what data questions are marked on.': 'Veri soruları tam olarak bunlara göre puanlanır.',
  'Make flashcards for the key terms and review them in short daily rounds.':
    'Anahtar terimler için bilgi kartları hazırla ve kısa günlük turlarla tekrar et.',
  'Precise terms make answers clearer and earn marks.': 'Doğru terimler cevapları netleştirir ve puan kazandırır.',
  // Foreign Language
  'Say-it-aloud flashcards': 'Sesli söyleme kartları',
  'Review vocabulary flashcards and say each word aloud before you flip the card.':
    'Kelime kartlarını tekrar et ve kartı çevirmeden önce her kelimeyi sesli söyle.',
  'Saying words aloud links sound, spelling and meaning.': 'Kelimeleri sesli söylemek ses, yazılış ve anlamı birbirine bağlar.',
  'Five sentences about you': 'Kendinle ilgili beş cümle',
  'Write five sentences about your own life using today’s words or tense.':
    'Bugünkü kelimeleri ya da zamanı kullanarak kendi hayatınla ilgili beş cümle yaz.',
  'Personal sentences are easier to remember and reuse in speaking.': 'Kişisel cümleler daha kolay hatırlanır ve konuşurken yeniden kullanılır.',
  '10-minute listening': '10 dakikalık dinleme',
  'Listen to a short clip in the language and write down five words you recognise.':
    'O dilde kısa bir kayıt dinle ve tanıdığın beş kelimeyi yaz.',
  'Regular listening makes exam audio feel familiar.': 'Düzenli dinlemek, sınavdaki ses kayıtlarını tanıdık hâle getirir.',
  'One-minute recordings': 'Bir dakikalık kayıtlar',
  'Record yourself answering a common exam question for one minute, then listen back.':
    'Sık sorulan bir sınav sorusunu bir dakika boyunca cevaplarken kendini kaydet, sonra dinle.',
  'Practising out loud reduces nerves in the speaking exam.': 'Sesli pratik yapmak konuşma sınavındaki heyecanı azaltır.',
  // Other
  'Teach it back': 'Başkasına anlatır gibi öğret',
  'Explain the topic out loud in simple words, as if teaching a younger student.':
    'Konuyu sanki daha küçük bir öğrenciye öğretiyormuş gibi basit kelimelerle sesli anlat.',
  'If you can explain it simply, you really understand it.': 'Bir şeyi basitçe açıklayabiliyorsan, gerçekten anlamışsın demektir.',
  'Blank-page recall': 'Boş sayfa tekrarı',
  'Close your notes, write everything you remember, then check and fill the gaps in a different colour.':
    'Notlarını kapat, hatırladığın her şeyi yaz, sonra kontrol et ve eksikleri farklı bir renkle tamamla.',
  'Pulling ideas from memory is one of the most effective ways to learn.': 'Bilgileri hafızadan çağırmak en etkili öğrenme yollarından biridir.',
  'Short, spaced sessions': 'Kısa ve aralıklı oturumlar',
  'Study in 25-minute sessions spread over several days instead of one long session.':
    'Tek bir uzun oturum yerine birkaç güne yayılmış 25 dakikalık oturumlarla çalış.',
  'Spreading practice out helps you remember for longer.': 'Pratiği zamana yaymak daha uzun süre hatırlamana yardım eder.',
  'Exam-condition practice': 'Sınav koşullarında pratik',
  'Answer practice questions with a timer and no notes, then mark your work.':
    'Süre tutarak ve notlara bakmadan alıştırma sorularını cevapla, sonra kendini değerlendir.',
  'Rehearsing the real conditions makes the exam feel familiar.': 'Gerçek koşulları prova etmek sınavı tanıdık hâle getirir.',
};

// ---------- Progress Tracker ----------
const PROGRESS: Record<string, string> = {
  'Notice the work you have done': 'Emeğini fark et',
  'Progress Tracker': 'İlerleme Takibi',
  'Real numbers from your quizzes, flashcards, study plan and exams on this device. Nothing here is estimated: when there is not enough data, the tracker says so.':
    'Bu cihazdaki testlerinden, bilgi kartlarından, çalışma planından ve sınavlarından gelen gerçek sayılar. Burada hiçbir şey tahmin değildir: yeterli veri olmadığında bunu açıkça söyler.',
  'Read only · reads your saved data and never changes it': 'Yalnızca okur · kayıtlı verilerini okur ve asla değiştirmez',
  'From this device': 'Bu cihazdan',
  'AI Exam Survival · Progress Tracker': 'AI Exam Survival · İlerleme Takibi',
  'Quiz Center': 'Test Merkezi',
  'Study Planner': 'Çalışma Planlayıcı',
  'Smart Flashcards': 'Akıllı Bilgi Kartları',
  'Exam Calendar': 'Sınav Takvimi',
  'could not be read': 'okunamadı',
  'not used yet': 'henüz kullanılmadı',
  '{count} quiz': '{count} test',
  '{count} quizzes': '{count} test',
  'no week planned': 'planlanmış hafta yok',
  '{count} sessions planned': '{count} oturum planlandı',
  '{count} step': '{count} adım',
  '{count} steps': '{count} adım',
  Improving: 'Yükseliyor',
  Dropping: 'Düşüyor',
  Steady: 'Sabit',
  'no data': 'veri yok',
  Strong: 'Güçlü',
  'Needs work': 'Çalışılmalı',
  'Getting there': 'Yolda',
  'Not enough data yet': 'Henüz yeterli veri yok',
  'Quiz average': 'Test ortalaması',
  'Answers correct': 'Doğru cevaplar',
  '{done} of {total}': '{done} / {total}',
  'Cards mastered': 'Öğrenilen kartlar',
  'Planner sessions': 'Planlayıcı oturumları',
  '{count} exam ahead': '{count} sınav yaklaşıyor',
  '{count} exams ahead': '{count} sınav yaklaşıyor',
  'Study Planner & Exam Calendar': 'Çalışma Planlayıcı ve Sınav Takvimi',
  'Quiz Center & Flashcards (not split by course)': 'Test Merkezi ve Bilgi Kartları (alt derslere ayrılmaz)',
  'Quiz Center & Flashcards': 'Test Merkezi ve Bilgi Kartları',
  'All tools': 'Tüm araçlar',
  '{good} of {total} quiz answers right': '{total} test cevabından {good} tanesi doğru',
  '{good} of {total} reviewed cards known': 'Tekrar edilen {total} karttan {good} tanesi biliniyor',
  'Take a 5-question {subject} quiz on “{topic}” and read every explanation.':
    '“{topic}” konusunda 5 soruluk bir {subject} testi çöz ve tüm açıklamaları oku.',
  'Make flashcards for the ideas you missed in “{topic}”.': '“{topic}” konusunda kaçırdığın fikirler için bilgi kartları hazırla.',
  'Keep “{topic}” fresh with one short {subject} quiz next week.': '“{topic}” konusunu taze tutmak için gelecek hafta kısa bir {subject} testi çöz.',
  'Study the “{deck}” deck in Review mode until the Review-again cards move up.':
    '“{deck}” destesini, “Tekrar et” kartları üst seviyeye çıkana kadar Tekrar modunda çalış.',
  'Do a quick Practice round of “{deck}” to keep it mastered.': '“{deck}” destesini öğrenilmiş tutmak için kısa bir Alıştırma turu yap.',
  'Reading from': 'Veri kaynakları',
  'Some saved data could not be read ({names}). It was left untouched and is not counted below. Everything else is shown normally.':
    'Bazı kayıtlı veriler okunamadı ({names}). Bunlara dokunulmadı ve aşağıda sayılmadı. Diğer her şey normal şekilde gösteriliyor.',
  'Your dashboard fills up as you study.': 'Panon sen çalıştıkça dolar.',
  'Finish a quiz, review some flashcards, plan a week or add an exam. Each one shows up here automatically.':
    'Bir test bitir, birkaç bilgi kartını tekrar et, bir hafta planla ya da bir sınav ekle. Her biri burada otomatik olarak görünür.',
  'Quizzes completed': 'Tamamlanan testler',
  'The latest 30 saved by Quiz Center': 'Test Merkezi’nin kaydettiği son 30 test',
  'Saved in Quiz Center': 'Test Merkezi’nde kayıtlı',
  'Average score': 'Ortalama puan',
  'Same as Quiz Center: the average of your quiz scores': 'Test Merkezi ile aynı: test puanlarının ortalaması',
  'Study sessions done': 'Tamamlanan çalışma oturumları',
  'In your current Study Planner week': 'Çalışma Planlayıcı’daki şu anki haftanda',
  'Flashcards mastered': 'Öğrenilen bilgi kartları',
  '{count} card reviewed at least once': '{count} kart en az bir kez tekrar edildi',
  '{count} cards reviewed at least once': '{count} kart en az bir kez tekrar edildi',
  'Active days': 'Aktif günler',
  '{count} in the last 30 days': 'Son 30 günde {count}',
  'Last 7 days': 'Son 7 gün',
  'Weekly study activity': 'Haftalık çalışma etkinliği',
  'Planner sessions count on their planned day once you tick them (an approximation, because the planner does not record when you ticked). Flashcards count each card’s most recent review only, so earlier reviews are not shown.':
    'Planlayıcı oturumları işaretlendiğinde planlandıkları güne sayılır (yaklaşık bir değerdir, çünkü planlayıcı işaretleme zamanını kaydetmez). Bilgi kartlarında her kartın yalnızca en son tekrarı sayılır, bu yüzden önceki tekrarlar gösterilmez.',
  'Study consistency': 'Çalışma istikrarı',
  'Keep the rhythm': 'Ritmini koru',
  'Current streak': 'Şu anki seri',
  'Best streak': 'En iyi seri',
  '{count} day': '{count} gün',
  '{count} days': '{count} gün',
  'A streak counts days in a row with saved activity, up to today or yesterday.':
    'Seri, bugüne ya da düne kadar art arda kayıtlı etkinlik olan günleri sayar.',
  'Planned vs completed': 'Planlanan ve tamamlanan',
  'Study Planner week: {from} – {to}': 'Çalışma Planlayıcı haftası: {from} – {to}',
  '{done} of {total} sessions': '{total} oturumdan {done} tanesi',
  'Planner sessions completed': 'Tamamlanan planlayıcı oturumları',
  '{done} of {due} sessions due so far are done · {minutes} of {planned} minutes':
    'Şimdiye kadarki {due} oturumdan {done} tanesi tamamlandı · {planned} dakikadan {minutes} dakika',
  'No Study Planner week yet.': 'Henüz bir Çalışma Planlayıcı haftası yok.',
  'Plan a week': 'Bir hafta planla',
  'Quiz scores over time': 'Zaman içinde test puanları',
  'Finish at least 3 quizzes to see how your scores change over time. You have {count} so far.':
    'Puanlarının zamanla nasıl değiştiğini görmek için en az 3 test bitir. Şu ana kadar {count} testin var.',
  'Subject performance': 'Ders performansı',
  'How each subject is going': 'Her ders nasıl gidiyor?',
  'Subjects appear here once you take a quiz, review flashcards, plan a week or add an exam.':
    'Bir test çözdüğünde, bilgi kartlarını tekrar ettiğinde, bir hafta planladığında ya da bir sınav eklediğinde dersler burada görünür.',
  'Take your first quiz': 'İlk testini çöz',
  Strongest: 'En güçlü',
  'None at 80% yet': 'Henüz %80’e ulaşan yok',
  'None below 60%': '%60’ın altında olan yok',
  'Based on quiz answers: strong at {strong}% or more correct, needs work below {weak}%. A subject needs at least {quizzes} quizzes or {answers} answers before it is rated.':
    'Test cevaplarına göre: %{strong} ve üzeri doğru güçlü, %{weak} altı çalışılmalı sayılır. Bir dersin değerlendirilmesi için en az {quizzes} test ya da {answers} cevap gerekir.',
  'Topic analysis': 'Konu analizi',
  'Going well': 'İyi gidenler',
  'No topic at {strong}% or more yet. A topic needs at least {count} quiz answers or {count} reviewed cards.':
    'Henüz %{strong} ve üzerinde konu yok. Bir konunun değerlendirilmesi için en az {count} test cevabı ya da {count} tekrar edilmiş kart gerekir.',
  'To revise next': 'Sırada tekrar edilecekler',
  'No topic is below {weak}% right now.': 'Şu an %{weak} altında konu yok.',
  '{count} topic is between {weak}% and {top}%,': '{count} konu %{weak} ile %{top} arasında,',
  '{count} topics are between {weak}% and {top}%,': '{count} konu %{weak} ile %{top} arasında,',
  'and {count} topic has too few answers to rate yet.': '{count} konunun ise değerlendirmek için henüz yeterli cevabı yok.',
  'and {count} topics have too few answers to rate yet.': '{count} konunun ise değerlendirmek için henüz yeterli cevabı yok.',
  'Exam readiness': 'Sınava hazırlık',
  'Add your upcoming exams to see your preparation for each one here.': 'Her birine ne kadar hazırlandığını burada görmek için yaklaşan sınavlarını ekle.',
  '{done} of {total} done': '{done} / {total} tamamlandı',
  'Preparation for {title}': '{title} için hazırlık',
  '{subject} sessions in the Study Planner before the exam': 'Sınavdan önce Çalışma Planlayıcı’daki {subject} oturumları',
  'None planned': 'Planlanmamış',
  'Latest {subject} quiz': 'Son {subject} testi',
  '{percent}% on {date}': '%{percent} · {date}',
  'No quiz results for this subject name': 'Bu ders adıyla test sonucu yok',
  'These are separate facts, not a readiness score. Quiz results are only linked when the subject name is the same in both tools.':
    'Bunlar ayrı ayrı bilgilerdir, bir hazırlık puanı değildir. Test sonuçları yalnızca iki araçta ders adı aynıysa eşleştirilir.',
  // charts
  Quizzes: 'Testler',
  Flashcards: 'Bilgi kartları',
  'Prep steps': 'Hazırlık adımları',
  'Activity in the last 7 days': 'Son 7 gündeki etkinlik',
  Day: 'Gün',
  'Quiz scores for your last {count} quizzes': 'Son {count} testinin puanları',
  '{date} · latest {percent}%': '{date} · son %{percent}',
  'Quiz score': 'Test puanı',
  'Strong ({percent}% or more)': 'Güçlü (%{percent} ve üzeri)',
  'Needs work (below {percent}%)': 'Çalışılmalı (%{percent} altı)',
};

export const TR_PHRASES: Record<string, string> = {
  ...SHARED,
  ...FLASHCARDS,
  ...CALENDAR,
  ...COACH,
  ...COACH_STRATEGIES,
  ...PROGRESS,
};
