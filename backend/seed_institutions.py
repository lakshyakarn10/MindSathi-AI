"""
Seed additional Indian institutions into the MindSaathi database.
Run: python seed_institutions.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.institution import Institution

COLLEGES = [
    ("MindSaathi University of Technology", "MSU-2026"),
    ("Indian Institute of Technology Bombay", "IIT-B"),
    ("Indian Institute of Technology Delhi", "IIT-D"),
    ("Indian Institute of Technology Madras", "IIT-M"),
    ("Indian Institute of Technology Kharagpur", "IIT-KGP"),
    ("Indian Institute of Technology Kanpur", "IIT-K"),
    ("Indian Institute of Technology Roorkee", "IIT-R"),
    ("Indian Institute of Technology Hyderabad", "IIT-H"),
    ("Indian Institute of Technology Bangalore", "IIT-BLR"),
    ("Indian Institute of Technology Guwahati", "IIT-G"),
    ("National Institute of Technology Trichy", "NIT-T"),
    ("National Institute of Technology Surathkal", "NIT-S"),
    ("National Institute of Technology Warangal", "NIT-W"),
    ("National Institute of Technology Calicut", "NIT-C"),
    ("National Institute of Technology Rourkela", "NIT-RKL"),
    ("Birla Institute of Technology and Science Pilani", "BITS-PIL"),
    ("Birla Institute of Technology and Science Goa", "BITS-GOA"),
    ("Birla Institute of Technology and Science Hyderabad", "BITS-HYD"),
    ("Vellore Institute of Technology", "VIT"),
    ("Manipal Institute of Technology", "MIT-MAHE"),
    ("SRM Institute of Science and Technology", "SRM"),
    ("Amrita School of Engineering", "AMRITA"),
    ("PSG College of Technology", "PSG"),
    ("Coimbatore Institute of Technology", "CIT"),
    ("Anna University", "AU-CHENNAI"),
    ("Jadavpur University", "JU"),
    ("Delhi Technological University", "DTU"),
    ("Netaji Subhas University of Technology", "NSUT"),
    ("Indraprastha Institute of Information Technology Delhi", "IIIT-D"),
    ("PES University", "PESU"),
    ("RV College of Engineering", "RVCE"),
    ("BMS College of Engineering", "BMSCE"),
    ("MS Ramaiah Institute of Technology", "MSRIT"),
    ("JSS Academy of Technical Education", "JSSATE"),
    ("Thapar Institute of Engineering and Technology", "TIET"),
    ("Chandigarh University", "CU"),
    ("Chitkara University", "CHU"),
    ("LPU Lovely Professional University", "LPU"),
    ("Christ University", "CHRIST"),
    ("Symbiosis Institute of Technology", "SIT-PUNE"),
    ("Pune Institute of Computer Technology", "PICT"),
    ("College of Engineering Pune", "COEP"),
    ("Vishwakarma Institute of Technology", "VIT-PUNE"),
    ("KIIT University", "KIIT"),
    ("Kalinga Institute of Industrial Technology", "KIIT-B"),
    ("Presidency University Bangalore", "PU-BLR"),
    ("CMR Institute of Technology", "CMRIT"),
    ("Dayananda Sagar University", "DSU"),
    ("KLE Technological University", "KLE"),
    ("Ramaiah University of Applied Sciences", "RUAS"),
    ("University of Mumbai", "MU"),
    ("University of Delhi", "DU"),
    ("Jawaharlal Nehru University", "JNU"),
    ("University of Hyderabad", "UOH"),
    ("Osmania University", "OU"),
    ("Bangalore University", "BU"),
    ("Savitribai Phule Pune University", "SPPU"),
    ("University of Calcutta", "CU-CALCUTTA"),
    ("Madras Institute of Technology", "MIT-ANNA"),
    ("Sri Venkateswara College of Engineering", "SVCE"),
    ("Karpagam College of Engineering", "KCE"),
    ("Thiagarajar College of Engineering", "TCE"),
    ("Karunya Institute of Technology and Sciences", "KITS"),
]

def seed_institutions():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    added = 0
    skipped = 0
    try:
        for name, code in COLLEGES:
            existing = db.query(Institution).filter(Institution.code == code).first()
            if not existing:
                inst = Institution(
                    name=name,
                    code=code,
                    country="India",
                    timezone="Asia/Kolkata",
                    privacy_threshold=15,
                )
                db.add(inst)
                added += 1
            else:
                skipped += 1
        db.commit()
        print(f"[+] Added {added} institutions, skipped {skipped} existing.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_institutions()
