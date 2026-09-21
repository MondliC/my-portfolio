const typedText = 'Learn the attack. Detect the signal. Explain the risk.';
const typedEl = document.getElementById('typed-line');
let i = 0;
function typeLine(){
  if(i <= typedText.length){
    typedEl.textContent = typedText.slice(0, i++);
    setTimeout(typeLine, 42);
  }
}
setTimeout(typeLine, 700);

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.project-card').forEach(card => {
      const matches = filter === 'all' || card.dataset.category.includes(filter);
      card.classList.toggle('hidden-project', !matches);
    });
  });
});

document.querySelectorAll('.expand-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    target.classList.toggle('open');
    btn.textContent = target.classList.contains('open') ? 'Hide case study' : 'View case study';
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

document.getElementById('year').textContent = new Date().getFullYear();
