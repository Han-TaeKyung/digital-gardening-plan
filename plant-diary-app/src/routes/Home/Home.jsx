import { useEffect, useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import styles from './Home.module.scss';

const NAV_ITEMS = [
  { id: 'daily', label: '데일리' },
  { id: 'monthly', label: '월별' },
  { id: 'plant-status', label: '내 식물상태' },
];

const DAILY_TASKS = [
  { key: 'watering', label: '물주기' },
  { key: 'statusCheck', label: '식물 상태확인' },
  { key: 'nutrient', label: '영양제 주입' },
];

const STATUS_OPTIONS = [
  { value: 'good', label: '좋음' },
  { value: 'caution', label: '주의' },
  { value: 'danger', label: '위험' },
];

const DEFAULT_DAILY = { watering: false, statusCheck: false, nutrient: false };
const DEFAULT_PLANTS = [
  { id: 1, name: '몬스테라' },
  { id: 2, name: '스투키' },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_PLANT_STATUS_LIST = [
  {
    id: 1,
    name: '몬스테라',
    date: today(),
    status: 'good',
    lightHours: '',
    wateringTiming: '',
    soilHumidity: '',
    nutrientCycle: '',
  },
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatHeaderDate() {
  const now = new Date();
  return `${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEKDAYS[now.getDay()]}요일`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date(today())) / (1000 * 60 * 60 * 24));
  return diff;
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (elements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

export default function Home() {
  const [plants, setPlants] = useLocalStorage('gardening.plants', DEFAULT_PLANTS);
  const [dailyByPlant, setDailyByPlant] = useLocalStorage('gardening.dailyByPlant', {});
  const [monthlyTasks, setMonthlyTasks] = useLocalStorage('gardening.monthly', []);
  const [plantStatuses, setPlantStatuses] = useLocalStorage(
    'gardening.plantStatuses',
    DEFAULT_PLANT_STATUS_LIST,
  );

  const sectionIds = NAV_ITEMS.map((item) => item.id);
  const activeSection = useActiveSection(sectionIds);

  return (
    <div className={styles.pageOuter}>
      <div className={styles.appFrame}>
        <header className={styles.header}>
          <p className={styles.dateLabel}>{formatHeaderDate()}</p>
          <h1 className={styles.greeting}>
            오늘도 잎이
            <br />
            반짝이는 하루예요
          </h1>
        </header>

        <nav className={styles.nav} aria-label="섹션 이동">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.navItem} ${activeSection === item.id ? styles.navItemActive : ''}`}
              onClick={() => scrollToSection(item.id)}
              aria-current={activeSection === item.id ? 'true' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main>
          <DailySection
            plants={plants}
            dailyByPlant={dailyByPlant}
            onPlantsChange={setPlants}
            onDailyChange={setDailyByPlant}
          />
          <MonthlySection tasks={monthlyTasks} onChange={setMonthlyTasks} />
          <PlantStatusSection statuses={plantStatuses} onChange={setPlantStatuses} />
        </main>
      </div>
    </div>
  );
}

function DailySection({ plants, dailyByPlant, onPlantsChange, onDailyChange }) {
  const [newPlantName, setNewPlantName] = useState('');

  const getTasksFor = (plantId) => dailyByPlant[plantId] ?? DEFAULT_DAILY;

  const toggle = (plantId, key) => {
    onDailyChange((prev) => {
      const current = prev[plantId] ?? DEFAULT_DAILY;
      return { ...prev, [plantId]: { ...current, [key]: !current[key] } };
    });
  };

  const addPlant = (e) => {
    e.preventDefault();
    if (!newPlantName.trim()) return;
    onPlantsChange((prev) => [...prev, { id: Date.now(), name: newPlantName.trim() }]);
    setNewPlantName('');
  };

  const removePlant = (plantId) => {
    onPlantsChange((prev) => prev.filter((p) => p.id !== plantId));
    onDailyChange((prev) => {
      const next = { ...prev };
      delete next[plantId];
      return next;
    });
  };

  const totalDone = plants.reduce(
    (sum, p) => sum + DAILY_TASKS.filter((task) => getTasksFor(p.id)[task.key]).length,
    0,
  );
  const totalTasks = plants.length * DAILY_TASKS.length;
  const summary =
    totalTasks === 0
      ? '식물을 추가하면 오늘의 케어가 시작돼요.'
      : totalDone === totalTasks
        ? '오늘의 케어를 모두 마쳤어요. 잘하고 있어요!'
        : `아직 ${totalTasks - totalDone}개 남았어요. 천천히 살펴봐요.`;

  return (
    <section id="daily" className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.infoCard}>
          <div className={styles.infoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C12 2 6 9 6 14a6 6 0 0012 0c0-5-6-12-6-12z" fill="#3F7D5C" />
            </svg>
          </div>
          <div>
            <div className={styles.infoTitle}>
              오늘의 케어 · {totalDone}/{totalTasks} 완료
            </div>
            <div className={styles.infoSubtitle}>{summary}</div>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>오늘의 케어</h2>

        <form className={styles.inlineForm} onSubmit={addPlant}>
          <input
            type="text"
            placeholder="식물 이름 추가 (예: 고무나무)"
            value={newPlantName}
            onChange={(e) => setNewPlantName(e.target.value)}
            aria-label="식물 이름"
          />
          <button type="submit">+ 추가</button>
        </form>

        {plants.length === 0 ? (
          <p className={styles.empty}>등록된 식물이 없습니다. 위에서 식물을 추가해보세요.</p>
        ) : (
          <div className={styles.taskList}>
            {plants.map((plant) => {
              const tasks = getTasksFor(plant.id);
              return (
                <div key={plant.id} className={styles.plantGroup}>
                  <div className={styles.plantGroupHeader}>
                    <span>🌿 {plant.name}</span>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removePlant(plant.id)}
                      aria-label={`${plant.name} 삭제`}
                    >
                      ✕
                    </button>
                  </div>
                  {DAILY_TASKS.map((task) => {
                    const done = Boolean(tasks[task.key]);
                    return (
                      <button
                        type="button"
                        key={task.key}
                        className={styles.taskRow}
                        onClick={() => toggle(plant.id, task.key)}
                        aria-pressed={done}
                        aria-label={`${plant.name} ${task.label}, ${done ? '완료됨' : '대기중'}`}
                      >
                        <span className={`${styles.checkDot} ${done ? styles.checkDotDone : ''}`}>
                          {done && (
                            <svg width="11" height="9" viewBox="0 0 12 10" fill="none">
                              <path
                                d="M1 5L4.5 8.5L11 1.5"
                                stroke="#fff"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <span className={styles.taskRowBody}>
                          <span className={done ? styles.taskRowTitleDone : styles.taskRowTitle}>
                            {plant.name} · {task.label}
                          </span>
                          <span className={styles.taskRowMeta}>{done ? '완료' : '대기중'}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function MonthlySection({ tasks, onChange }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const addTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onChange((prev) => [...prev, { id: Date.now(), title: title.trim(), date, done: false }]);
    setTitle('');
    setDate('');
  };

  const toggleDone = (id) => {
    onChange((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );
  };

  const removeTask = (id) => {
    onChange((prev) => prev.filter((task) => task.id !== id));
  };

  const doneCount = tasks.filter((t) => t.done).length;
  const doneRate = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);

  return (
    <section id="monthly" className={styles.section}>
      <div className={styles.sectionInner}>
        <h2 className={styles.sectionTitle}>이번 달, 무럭무럭</h2>

        <div className={styles.statRow}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{tasks.length}건</div>
            <div className={styles.statLabel}>이번 달 케어 일정</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{doneRate}%</div>
            <div className={styles.statLabel}>완료율</div>
          </div>
        </div>

        <h3 className={styles.subheading}>예정된 일정</h3>

        <form className={styles.inlineForm} onSubmit={addTask}>
          <input
            type="text"
            placeholder="예: 몬스테라 분갈이"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="월별 케어 항목"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="예정일"
          />
          <button type="submit">+ 추가</button>
        </form>

        {tasks.length === 0 ? (
          <p className={styles.empty}>등록된 월별 케어 일정이 없습니다.</p>
        ) : (
          <ul className={styles.monthlyList}>
            {tasks.map((task) => {
              const dday = daysUntil(task.date);
              return (
                <li key={task.id} className={styles.monthlyItem}>
                  <button
                    type="button"
                    className={`${styles.checkDot} ${task.done ? styles.checkDotDone : ''}`}
                    onClick={() => toggleDone(task.id)}
                    aria-pressed={task.done}
                    aria-label={`${task.title} ${task.done ? '완료됨' : '대기중'}`}
                  >
                    {task.done && (
                      <svg width="11" height="9" viewBox="0 0 12 10" fill="none">
                        <path
                          d="M1 5L4.5 8.5L11 1.5"
                          stroke="#fff"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                  <span className={styles.monthlyItemBody}>
                    <span className={task.done ? styles.taskRowTitleDone : styles.taskRowTitle}>
                      {task.title}
                    </span>
                    {task.date && <span className={styles.taskRowMeta}>{task.date}</span>}
                  </span>
                  {!task.done && dday !== null && (
                    <span
                      className={`${styles.ddayBadge} ${
                        dday <= 3 ? styles.ddayUrgent : dday <= 10 ? styles.ddaySoon : styles.ddayLater
                      }`}
                    >
                      {dday >= 0 ? `D-${dday}` : `D+${-dday}`}
                    </span>
                  )}
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeTask(task.id)}
                    aria-label={`${task.title} 삭제`}
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function PlantStatusSection({ statuses, onChange }) {
  const addEntry = () => {
    onChange((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        date: today(),
        status: 'good',
        lightHours: '',
        wateringTiming: '',
        soilHumidity: '',
        nutrientCycle: '',
      },
    ]);
  };

  const saveEntry = (id, values) => {
    onChange((prev) => prev.map((entry) => (entry.id === id ? { id, ...values } : entry)));
  };

  const removeEntry = (id) => {
    onChange((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <section id="plant-status" className={styles.section}>
      <div className={styles.sectionInner}>
        <h2 className={styles.sectionTitle}>내 식물들</h2>

        <div className={styles.plantGrid}>
          {statuses.map((entry) => (
            <StatusBox
              key={entry.id}
              entry={entry}
              onSave={(values) => saveEntry(entry.id, values)}
              onRemove={() => removeEntry(entry.id)}
            />
          ))}
        </div>

        {statuses.length === 0 && (
          <p className={styles.empty}>등록된 식물이 없습니다. 아래 버튼으로 추가해보세요.</p>
        )}

        <button type="button" className={styles.ctaBtn} onClick={addEntry}>
          + 식물 추가
        </button>
      </div>
    </section>
  );
}

function StatusBox({ entry, onSave, onRemove }) {
  const [form, setForm] = useState(entry);
  const [saved, setSaved] = useState(false);

  const handleField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(form);
    setSaved(true);
  };

  const statusClass =
    form.status === 'danger'
      ? styles.pillDanger
      : form.status === 'caution'
        ? styles.pillCaution
        : styles.pillGood;

  return (
    <div className={styles.plantCard}>
      <div className={styles.plantCardTop}>
        <span className={styles.plantAvatar}>🌿</span>
        <select className={statusClass} value={form.status} onChange={handleField('status')}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.plantCardHeader}>
        <input
          type="text"
          className={styles.plantNameInput}
          placeholder="식물 이름"
          aria-label="식물 이름"
          value={form.name}
          onChange={handleField('name')}
        />
        <button
          type="button"
          className={styles.removeBtn}
          onClick={onRemove}
          aria-label={`${form.name || '식물'} 삭제`}
        >
          ✕
        </button>
      </div>

      <form className={styles.statusForm} onSubmit={handleSave}>
        <div className={styles.formField}>
          <label htmlFor={`date-${entry.id}`}>기록일</label>
          <input
            id={`date-${entry.id}`}
            type="date"
            value={form.date || ''}
            onChange={handleField('date')}
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor={`lightHours-${entry.id}`}>일일 빛 주는시간</label>
          <input
            id={`lightHours-${entry.id}`}
            type="text"
            placeholder="예: 오전 8시~오후 2시 (6시간)"
            value={form.lightHours}
            onChange={handleField('lightHours')}
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor={`wateringTiming-${entry.id}`}>물주는 타이밍</label>
          <input
            id={`wateringTiming-${entry.id}`}
            type="text"
            placeholder="예: 흙 표면이 마르면, 주 1회"
            value={form.wateringTiming}
            onChange={handleField('wateringTiming')}
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor={`soilHumidity-${entry.id}`}>흙의 습도</label>
          <input
            id={`soilHumidity-${entry.id}`}
            type="text"
            placeholder="예: 촉촉함 / 보통 / 건조"
            value={form.soilHumidity}
            onChange={handleField('soilHumidity')}
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor={`nutrientCycle-${entry.id}`}>영양제 주기</label>
          <input
            id={`nutrientCycle-${entry.id}`}
            type="text"
            placeholder="예: 2주에 1회"
            value={form.nutrientCycle}
            onChange={handleField('nutrientCycle')}
          />
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.saveBtn}>
            저장하기
          </button>
          {saved && (
            <span className={styles.savedNotice} aria-live="polite">
              저장됨 ✓
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
