const container = document.getElementById('eyesContainer');
const text = document.getElementById('mainText');
const specialEyes = document.getElementById('specialEyes');
const initialOverlay = document.getElementById('initialOverlay');
let totalEyes = isMobile() ? 10 : 20; // 10 eyes on mobile, 20 on desktop
let openedEyes = 0;
const placedEyes = [];
let failSafeTimer = null;

// hitbox eyes
const eyeWidth = isMobile() ? 60 : 180; 
const eyeHeight = isMobile() ? 45 : 140; 

// no-eye zone
const centerRect = isMobile() ? {
    x: window.innerWidth / 2 - 150,  
    y: window.innerHeight / 2 - 120, 
    width: 300,                      
    height: 240                      
} : {
    x: window.innerWidth / 2 - 320,
    y: window.innerHeight / 2 - 250,
    width: 640,
    height: 500
};

const topRect = {
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: 60
};


// text blur
function updateBlur() {
    const maxBlur = 20;
    const minBlur = 0;
    const blurValue = Math.max(minBlur, maxBlur - (openedEyes / totalEyes) * maxBlur);
    text.style.filter = `blur(${blurValue}px)`;
}

function intersects(rect1, rect2) {
    return !(
        rect1.x + rect1.width < rect2.x ||
        rect1.x > rect2.x + rect2.width ||
        rect1.y + rect1.height < rect2.y ||
        rect1.y > rect2.y + rect2.height
    );
}


// eyes
const allEyes = [];

function createEye(x, y) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('eye-wrapper');
    if (!isMobile()) {
        wrapper.classList.add('desktop-hitbox');
    }
    wrapper.style.left = `${x}px`;
    wrapper.style.top = `${y}px`;

    const eye = document.createElement('div');
    eye.classList.add('eye');

    const iris = document.createElement('div');
    iris.classList.add('iris');

    const pupil = document.createElement('div');
    pupil.classList.add('pupil');

    iris.appendChild(pupil);
    eye.appendChild(iris);
    wrapper.appendChild(eye);
    container.appendChild(wrapper);

    allEyes.push({ iris, pupil, wrapper, eye });
}

function generateEyes() {
    const maxTries = 1000;
    let tries = 0;

    while (placedEyes.length < totalEyes && tries < maxTries) {
        const finalX = Math.random() * (window.innerWidth - eyeWidth);
        const finalY = Math.random() * (window.innerHeight - eyeHeight);

        const newRect = { x: finalX, y: finalY, width: eyeWidth, height: eyeHeight };

        const overlaps = placedEyes.some(rect => intersects(rect, newRect));
        const overlapsText = intersects(centerRect, newRect) || intersects(topRect, newRect);

        if (!overlaps && !overlapsText) {
            placedEyes.push(newRect);
            createEye(finalX, finalY);
        }

        tries++;
    }

    if (placedEyes.length < totalEyes) {
        console.warn(`Only placed ${placedEyes.length} eyes (max: ${totalEyes})`);
    }
}


// look at center
function lookAtCenter() {
    if (failSafeTimer) {
        clearTimeout(failSafeTimer);
        failSafeTimer = null;
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    allEyes.forEach(({ iris, pupil, wrapper, eye }) => {
        if (!eye.classList.contains('open')) {
            eye.classList.add('open');
            openedEyes++;
        }

        const eyeRect = wrapper.getBoundingClientRect();
        const eyeX = eyeRect.left + eyeRect.width / 2;
        const eyeY = eyeRect.top + eyeRect.height / 2;

        const dx = centerX - eyeX;
        const dy = centerY - eyeY;
        const angle = Math.atan2(dy, dx);

        const offset = isMobile() ? 7 : 15; 
        const xShift = Math.cos(angle) * offset;
        const yShift = Math.sin(angle) * offset;

        iris.style.transform = `translate(${xShift}px, ${yShift}px)`;
        pupil.style.transform = `translate(0, 0)`;
    });

    // Update blur 
    text.style.filter = 'blur(0px)';

    // Play audio
    const audio = document.querySelector('audio');
    audio.play().catch(e => console.log("Audio play failed:", e));

    // closing animation
    setTimeout(() => {
        document.body.classList.add('black-bg');

        allEyes.forEach(({ eye }) => {
            eye.classList.add('closing');
        });

        setTimeout(() => {
            container.classList.add('fade-out');
            text.classList.add('fade-out');

            // Show special eyes
            specialEyes.style.opacity = '1';
            const specialEyeElements = document.querySelectorAll('.special-eye');
            specialEyeElements.forEach(eye => {
                eye.classList.add('open');
            });
        }, 800); 
    }, 8000);
}

function openEyesSequentially() {
    let delay = 0;
    const eyeOpenInterval = 300; 

    allEyes.forEach(({ eye }) => {
        setTimeout(() => {
            eye.classList.add('open');
            openedEyes++;
            updateBlur();

            if (openedEyes === totalEyes) {
                setTimeout(lookAtCenter, 1500);
            }
        }, delay);

        delay += eyeOpenInterval;
    });
}

window.addEventListener('resize', () => {
    if (openedEyes === totalEyes) lookAtCenter();
});

// Check if mobile
function isMobile() {
    return window.innerWidth <= 768;
}

function init() {
    generateEyes();
    updateBlur();

    if (isMobile()) {
        // auto open
        setTimeout(openEyesSequentially, 1000);
    } else {
        allEyes.forEach(({ eye, wrapper }) => {
            wrapper.style.pointerEvents = 'all';
            wrapper.addEventListener('mouseenter', () => {
                if (!eye.classList.contains('open')) {
                    eye.classList.add('open');
                    openedEyes++;
                    updateBlur();

                    if (openedEyes === totalEyes) {
                        setTimeout(lookAtCenter, 1500);
                    }
                }
            });
        });

        // fail-safe timer for desktop 
        failSafeTimer = setTimeout(() => {
            if (openedEyes < totalEyes) {
                console.log("Fail-safe triggered - not all eyes were opened in time");
                lookAtCenter();
            }
        }, 15000); 
    }
}

// remove overlay
initialOverlay.addEventListener('click', function () {
    this.style.opacity = '0';
    setTimeout(() => {
        this.style.display = 'none';
        init(); 
    }, 1000); 
});