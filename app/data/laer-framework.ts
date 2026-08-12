export interface LaerFramework {
  title: string;
  description: string;
  parts: {
    title: string;
    description: string;
    items: string[];
  }[];
}

export const laerFrameworks: Record<string, LaerFramework> = {
  en: {
    title: 'LAER Framework',
    description: 'Soft skills for effective objection handling',
    parts: [
      {
        title: 'Listen',
        description: 'Practice active listening when client raises objections or concerns',
        items: [
          'Allow client to fully express their concerns without interrupting',
          'Demonstrate patience and attention when client explains their constraints',
          'Resist the urge to immediately respond with a pitch',
          'Show active listening by acknowledging what was said',
        ],
      },
      {
        title: 'Acknowledge',
        description: 'Validate client concerns and show understanding',
        items: [
          'Use empathetic language to demonstrate you heard the objection',
          'Relate to client\'s situation with phrases like "I understand" or "That makes sense"',
          'Avoid dismissing or minimizing their concerns',
          'Normalize their concerns by sharing that others felt similarly',
        ],
      },
      {
        title: 'Explore',
        description: 'Probe deeper to understand the root cause of objections',
        items: [
          'Ask follow-up questions to uncover the real concern behind the objection',
          'Determine if the concern is about budget, value, timing, or authority',
          'Use open-ended questions to gather more information',
          'Understand the specific nature and context of their concern',
        ],
      },
      {
        title: 'Respond',
        description: 'Address concerns with tailored solutions',
        items: [
          'Provide solutions specifically addressing their stated concerns',
          'Share relevant case studies or examples of similar merchants',
          'Offer alternatives or flexible options to overcome objections',
          'Work collaboratively with client to find mutually beneficial solutions',
        ],
      },
    ],
  },
  id: {
    title: 'Framework LAER',
    description: 'Soft skills untuk menangani keberatan secara efektif',
    parts: [
      {
        title: 'Listen',
        description: 'Praktikkan mendengarkan aktif saat klien mengajukan keberatan atau kekhawatiran',
        items: [
          'Biarkan klien mengekspresikan kekhawatiran mereka sepenuhnya tanpa menyela',
          'Tunjukkan kesabaran dan perhatian saat klien menjelaskan kendala mereka',
          'Tahan keinginan untuk langsung merespons dengan penawaran',
          'Tunjukkan mendengarkan aktif dengan mengakui apa yang dikatakan',
        ],
      },
      {
        title: 'Acknowledge',
        description: 'Validasi kekhawatiran klien dan tunjukkan pemahaman',
        items: [
          'Gunakan bahasa empatik untuk menunjukkan Anda mendengar keberatan tersebut',
          'Hubungkan dengan situasi klien dengan frasa seperti "Saya mengerti" atau "Itu masuk akal"',
          'Hindari mengabaikan atau meminimalkan kekhawatiran mereka',
          'Normalkan kekhawatiran mereka dengan membagikan bahwa orang lain merasakan hal serupa',
        ],
      },
      {
        title: 'Explore',
        description: 'Gali lebih dalam untuk memahami akar penyebab keberatan',
        items: [
          'Ajukan pertanyaan lanjutan untuk mengungkap kekhawatiran sebenarnya di balik keberatan',
          'Tentukan apakah kekhawatiran tersebut tentang anggaran, nilai, waktu, atau wewenang',
          'Gunakan pertanyaan terbuka untuk mengumpulkan lebih banyak informasi',
          'Pahami sifat spesifik dan konteks dari kekhawatiran mereka',
        ],
      },
      {
        title: 'Respond',
        description: 'Tanggapi kekhawatiran dengan solusi yang disesuaikan',
        items: [
          'Berikan solusi yang secara khusus mengatasi kekhawatiran yang mereka nyatakan',
          'Bagikan studi kasus yang relevan atau contoh pedagang serupa',
          'Tawarkan alternatif atau opsi fleksibel untuk mengatasi keberatan',
          'Bekerja sama dengan klien untuk menemukan solusi yang saling menguntungkan',
        ],
      },
    ],
  },
  ms: {
    title: 'Framework LAER',
    description: 'Kemahiran lembut untuk mengendalikan bantahan dengan berkesan',
    parts: [
      {
        title: 'Listen',
        description: 'Amalkan mendengar secara aktif apabila klien menimbulkan bantahan atau kebimbangan',
        items: [
          'Benarkan klien meluahkan kebimbangan mereka sepenuhnya tanpa mencelah',
          'Tunjukkan kesabaran dan perhatian apabila klien menerangkan kekangan mereka',
          'Tahan keinginan untuk segera menjawab dengan tawaran',
          'Tunjukkan mendengar secara aktif dengan mengakui apa yang dikatakan',
        ],
      },
      {
        title: 'Acknowledge',
        description: 'Sahkan kebimbangan klien dan tunjukkan pemahaman',
        items: [
          'Gunakan bahasa empati untuk menunjukkan anda mendengar bantahan tersebut',
          'Kaitkan dengan situasi klien dengan frasa seperti "Saya faham" atau "Itu masuk akal"',
          'Elakkan mengabaikan atau meminimumkan kebimbangan mereka',
          'Normalkan kebimbangan mereka dengan berkongsi bahawa orang lain merasakan perkara serupa',
        ],
      },
      {
        title: 'Explore',
        description: 'Kaji lebih mendalam untuk memahami punca sebenar bantahan',
        items: [
          'Tanya soalan susulan untuk mendedahkan kebimbangan sebenar di sebalik bantahan',
          'Tentukan sama ada kebimbangan itu tentang belanjawan, nilai, masa, atau kuasa',
          'Gunakan soalan terbuka untuk mengumpul lebih banyak maklumat',
          'Fahami sifat khusus dan konteks kebimbangan mereka',
        ],
      },
      {
        title: 'Respond',
        description: 'Tangani kebimbangan dengan penyelesaian yang disesuaikan',
        items: [
          'Berikan penyelesaian yang khusus menangani kebimbangan yang mereka nyatakan',
          'Kongsikan kajian kes yang relevan atau contoh peniaga serupa',
          'Tawarkan alternatif atau pilihan fleksibel untuk mengatasi bantahan',
          'Bekerjasama dengan klien untuk mencari penyelesaian yang saling menguntungkan',
        ],
      },
    ],
  },
  tl: {
    title: 'LAER Framework',
    description: 'Soft skills para sa epektibong pag-handle ng objections',
    parts: [
      {
        title: 'Listen',
        description: 'Magsanay ng active listening kapag may objections o concerns ang kliyente',
        items: [
          'Hayaan ang kliyente na lubusang ipahayag ang kanilang concerns nang hindi nakakaabala',
          'Magpakita ng pasensya at atensyon kapag nagpapaliwanag ang kliyente ng kanilang constraints',
          'Pigilan ang pagnanais na agad magreply ng pitch',
          'Magpakita ng active listening sa pamamagitan ng pag-acknowledge sa sinabi',
        ],
      },
      {
        title: 'Acknowledge',
        description: 'I-validate ang concerns ng kliyente at magpakita ng pag-unawa',
        items: [
          'Gumamit ng empathetic language para ipakita na narinig mo ang objection',
          'Makipag-relate sa sitwasyon ng kliyente gamit ang mga phrase tulad ng "I understand" o "That makes sense"',
          'Iwasan ang pag-dismiss o pag-minimize ng kanilang concerns',
          'I-normalize ang kanilang concerns sa pamamagitan ng pagbabahagi na may iba ring nakaramdam ng pareho',
        ],
      },
      {
        title: 'Explore',
        description: 'Mag-probe nang mas malalim para maintindihan ang root cause ng objections',
        items: [
          'Magtanong ng follow-up questions para malaman ang tunay na concern sa likod ng objection',
          'Tukuyin kung ang concern ay tungkol sa budget, value, timing, o authority',
          'Gumamit ng open-ended questions para makakuha ng mas maraming impormasyon',
          'Unawain ang specific na kalikasan at context ng kanilang concern',
        ],
      },
      {
        title: 'Respond',
        description: 'Tugunan ang concerns gamit ang tailored solutions',
        items: [
          'Magbigay ng solutions na specifically tumutugunan sa kanilang stated concerns',
          'Mag-share ng relevant case studies o examples ng similar merchants',
          'Mag-alok ng alternatives o flexible options para malampasan ang objections',
          'Magtrabaho nang collaborative kasama ang kliyente para makahanap ng mutually beneficial solutions',
        ],
      },
    ],
  },
  vi: {
    title: 'Framework LAER',
    description: 'Kỹ năng mềm để xử lý phản đối hiệu quả',
    parts: [
      {
        title: 'Listen',
        description: 'Thực hành lắng nghe tích cực khi khách hàng nêu lên phản đối hoặc lo ngại',
        items: [
          'Cho phép khách hàng bày tỏ đầy đủ mối quan tâm của họ mà không làm gián đoạn',
          'Thể hiện sự kiên nhẫn và chú ý khi khách hàng giải thích các ràng buộc của họ',
          'Kiềm chế việc phản ứng ngay lập tức bằng một lời chào hàng',
          'Thể hiện lắng nghe tích cực bằng cách ghi nhận những gì đã được nói',
        ],
      },
      {
        title: 'Acknowledge',
        description: 'Xác nhận mối quan tâm của khách hàng và thể hiện sự hiểu biết',
        items: [
          'Sử dụng ngôn ngữ đồng cảm để chứng tỏ bạn đã nghe phản đối',
          'Liên hệ với tình huống của khách hàng với các cụm từ như "Tôi hiểu" hoặc "Điều đó có lý"',
          'Tránh bác bỏ hoặc giảm thiểu mối quan tâm của họ',
          'Bình thường hóa mối quan tâm của họ bằng cách chia sẻ rằng người khác cũng cảm thấy tương tự',
        ],
      },
      {
        title: 'Explore',
        description: 'Tìm hiểu sâu hơn để hiểu nguyên nhân gốc rễ của phản đối',
        items: [
          'Đặt câu hỏi tiếp theo để phát hiện mối quan tâm thực sự đằng sau phản đối',
          'Xác định xem mối quan tâm là về ngân sách, giá trị, thời gian hay thẩm quyền',
          'Sử dụng câu hỏi mở để thu thập thêm thông tin',
          'Hiểu bản chất cụ thể và bối cảnh của mối quan tâm của họ',
        ],
      },
      {
        title: 'Respond',
        description: 'Giải quyết mối quan tâm với các giải pháp phù hợp',
        items: [
          'Cung cấp các giải pháp giải quyết cụ thể mối quan tâm mà họ đã nêu',
          'Chia sẻ các nghiên cứu tình huống có liên quan hoặc ví dụ về các nhà bán hàng tương tự',
          'Đề xuất các phương án thay thế hoặc tùy chọn linh hoạt để vượt qua phản đối',
          'Làm việc cộng tác với khách hàng để tìm giải pháp cùng có lợi',
        ],
      },
    ],
  },
  th: {
    title: 'LAER Framework',
    description: 'ทักษะส่วนบุคคลสำหรับการจัดการข้อโต้แย้งอย่างมีประสิทธิภาพ',
    parts: [
      {
        title: 'Listen',
        description: 'ฝึกฟังอย่างตั้งใจเมื่อลูกค้ายกประเด็นข้อโต้แย้งหรือข้อกังวล',
        items: [
          'ให้ลูกค้าแสดงความกังวลของพวกเขาอย่างเต็มที่โดยไม่ขัดจังหวะ',
          'แสดงความอดทนและความใส่ใจเมื่อลูกค้าอธิบายข้อจำกัดของพวกเขา',
          'ยับยั้งความต้องการที่จะตอบกลับทันทีด้วยการนำเสนอ',
          'แสดงการฟังอย่างตั้งใจโดยรับทราบสิ่งที่พูด',
        ],
      },
      {
        title: 'Acknowledge',
        description: 'ยืนยันความกังวลของลูกค้าและแสดงความเข้าใจ',
        items: [
          'ใช้ภาษาที่เห็นอกเห็นใจเพื่อแสดงว่าคุณได้ยินข้อโต้แย้ง',
          'เชื่อมโยงกับสถานการณ์ของลูกค้าด้วยวลีเช่น "ฉันเข้าใจ" หรือ "นั่นสมเหตุสมผล"',
          'หลีกเลี่ยงการเพิกเฉยหรือลดความสำคัญของความกังวลของพวกเขา',
          'ทำให้ความกังวลของพวกเขาเป็นเรื่องปกติโดยแบ่งปันว่าคนอื่นๆ ก็รู้สึกเช่นเดียวกัน',
        ],
      },
      {
        title: 'Explore',
        description: 'สำรวจลึกลงไปเพื่อเข้าใจสาเหตุหลักของข้อโต้แย้ง',
        items: [
          'ถามคำถามติดตามเพื่อเปิดเผยความกังวลที่แท้จริงเบื้องหลังข้อโต้แย้ง',
          'กำหนดว่าความกังวลเกี่ยวกับงบประมาณ คุณค่า เวลา หรืออำนาจ',
          'ใช้คำถามปลายเปิดเพื่อรวบรวมข้อมูลเพิ่มเติม',
          'เข้าใจลักษณะเฉพาะและบริบทของความกังวลของพวกเขา',
        ],
      },
      {
        title: 'Respond',
        description: 'จัดการความกังวลด้วยโซลูชันที่ปรับแต่งเฉพาะ',
        items: [
          'ให้โซลูชันที่จัดการกับความกังวลที่พวกเขาระบุโดยเฉพาะ',
          'แบ่งปันกรณีศึกษาที่เกี่ยวข้องหรือตัวอย่างของผู้ค้าที่คล้ายกัน',
          'เสนอทางเลือกหรือตัวเลือกที่ยืดหยุ่นเพื่อเอาชนะข้อโต้แย้ง',
          'ทำงานร่วมกับลูกค้าเพื่อหาโซลูชันที่เป็นประโยชน์ร่วมกัน',
        ],
      },
    ],
  },
};

