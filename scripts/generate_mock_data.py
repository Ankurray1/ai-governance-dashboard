import random, json, csv, datetime as dt
random.seed(20261120)
ASOF = dt.date(2026,11,20)

LOC = [("Bengaluru",1100),("Pune",450),("London",380),("New York",300),("Singapore",170)]
NAMES = {
 "IN": (["Aarav","Priya","Rohan","Ananya","Vikram","Sneha","Arjun","Kavya","Rahul","Isha","Karthik","Meera","Siddharth","Neha","Aditya","Pooja","Varun","Divya","Nikhil","Shreya","Manish","Ritu","Abhishek","Tanvi","Harsh","Nisha","Pranav","Aishwarya","Gaurav","Swati","Rajesh","Lakshmi","Deepak","Anjali","Suresh","Bhavna","Akash","Ritika","Vivek","Sanjana","Kunal","Pallavi","Amit","Rhea","Yash","Madhuri","Tarun","Shalini","Naveen","Jyoti","Mohit","Kriti","Sameer","Anusha","Ashwin","Nandini","Hemant","Gayatri","Dhruv","Bhargavi","Imran","Farah","Joseph","Mary","Gurpreet","Simran","Debashish","Moumita","Bikash","Pranjal"],
        ["Sharma","Iyer","Reddy","Nair","Patel","Gupta","Rao","Menon","Kulkarni","Joshi","Desai","Singh","Kumar","Verma","Pillai","Bhat","Shetty","Chatterjee","Banerjee","Mukherjee","Das","Bose","Agarwal","Mehta","Shah","Kapoor","Malhotra","Saxena","Mishra","Pandey","Srinivasan","Krishnan","Hegde","Naidu","Choudhury","Bora","Gogoi","Kalita","Sinha","Thomas","Fernandes","D'Souza","Khan","Qureshi","Gill","Sandhu","Deshpande","Patil","Jain","Arora"]),
 "UK": (["James","Emily","Oliver","Sophie","Daniel","Hannah","Thomas","Chloe","William","Charlotte","Harry","Amelia","George","Isabel","Jack","Lucy","Samuel","Ellie","Benjamin","Grace","Callum","Freya","Rory","Imogen","Liam","Aisha","Tom","Zara","Matthew","Holly"],
        ["Smith","Jones","Taylor","Brown","Williams","Wilson","Johnson","Davies","Evans","Thomas","Roberts","Walker","Wright","Robinson","Thompson","White","Hughes","Edwards","Green","Hall","Wood","Harris","Clarke","Patel","Khan","Lewis","Jackson","Turner","Hill","Moore"]),
 "US": (["Michael","Sarah","David","Jessica","Ryan","Megan","Kevin","Ashley","Brian","Lauren","Jason","Rachel","Eric","Nicole","Justin","Amanda","Tyler","Kayla","Brandon","Samantha","Carlos","Maria","Andre","Jasmine","Ethan","Olivia","Noah","Ava","Lucas","Mia"],
        ["Miller","Davis","Garcia","Rodriguez","Martinez","Anderson","Taylor","Thomas","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Clark","Lewis","Robinson","Walker","Young","Allen","King","Scott","Nguyen","Hill","Adams","Baker","Nelson","Carter"]),
 "SG": (["Wei Ling","Jun Hao","Mei Xin","Darren","Shu Fen","Kai Wen","Rachel","Marcus","Hui Min","Zhi Hao","Siti","Farhan","Priya","Arun","Jia Hui","Ryan","Nur Aisyah","Daniel","Xin Yi","Bryan"],
        ["Tan","Lim","Lee","Ng","Wong","Goh","Chua","Ong","Teo","Koh","Chan","Low","Yeo","Sim","Rahman","Ismail","Pillai","Nair","Chen","Ho"])}
REG = {"Bengaluru":"IN","Pune":"IN","London":"UK","New York":"US","Singapore":"SG"}

DEPTS = [
 ("Engineering","VP Engineering",25,700,[("Platform",130),("Payments",110),("Mobile",100),("Data Engineering",95),("Infrastructure",90),("QA & Automation",95),("Security Engineering",80)]),
 ("Marketing","Head of Marketing",18,260,[("Brand",50),("Performance Marketing",60),("Content & Social",70),("Product Marketing",50),("Events",30)]),
 ("Sales","VP Sales",22,520,[("Enterprise Sales",130),("Mid-Market Sales",150),("Sales Development",140),("Solutions Engineering",60),("Sales Ops",40)]),
 ("Support","Head of Support",18,480,[("Tier 1 Support",200),("Tier 2 Support",120),("Customer Success",120),("Support Ops",40)]),
 ("Product & Design","Head of Product",10,160,[("Product Management",60),("UX Design",50),("UX Research",25),("Design Systems",25)]),
 ("Finance & Ops","Finance Controller",7,180,[("Office of the CEO",6),("FP&A",40),("Accounting",50),("Procurement",25),("Legal",24),("IT",35)]),
 ("HR","Head of HR",5,100,[("Talent Acquisition",45),("People Ops",35),("Learning & Development",20)]),
]
TITLES = {
 "Platform":["Software Engineer","Senior Software Engineer","Staff Engineer"],"Payments":["Software Engineer","Senior Software Engineer","Staff Engineer"],
 "Mobile":["Mobile Engineer","Senior Mobile Engineer"],"Data Engineering":["Data Engineer","Senior Data Engineer","Analytics Engineer"],
 "Infrastructure":["Site Reliability Engineer","DevOps Engineer","Senior SRE"],"QA & Automation":["QA Engineer","Senior QA Engineer","Automation Engineer"],
 "Security Engineering":["Security Engineer","Senior Security Engineer"],"Brand":["Brand Manager","Graphic Designer","Copywriter"],
 "Performance Marketing":["Performance Marketer","Marketing Analyst","SEO Specialist"],"Content & Social":["Content Writer","Video Producer","Social Media Manager"],
 "Product Marketing":["Product Marketing Manager"],"Events":["Events Manager","Events Coordinator"],
 "Enterprise Sales":["Account Executive","Senior Account Executive"],"Mid-Market Sales":["Account Executive","Account Manager"],
 "Sales Development":["Sales Development Rep","Senior SDR"],"Solutions Engineering":["Solutions Engineer","Senior Solutions Engineer"],"Sales Ops":["Sales Ops Analyst","CRM Administrator"],
 "Tier 1 Support":["Support Specialist","Support Associate"],"Tier 2 Support":["Technical Support Engineer","Senior Support Engineer"],
 "Customer Success":["Customer Success Manager","Onboarding Specialist"],"Support Ops":["Support Ops Analyst","Knowledge Base Editor"],
 "Product Management":["Product Manager","Senior Product Manager","Associate PM"],"UX Design":["Product Designer","Senior Product Designer"],
 "UX Research":["UX Researcher"],"Design Systems":["Design Systems Designer","UI Engineer"],
 "Office of the CEO":["Chief of Staff","Executive Assistant"],"FP&A":["Financial Analyst","Senior Financial Analyst"],"Accounting":["Accountant","Senior Accountant","AP Specialist"],
 "Procurement":["Procurement Specialist","Vendor Manager"],"Legal":["Legal Counsel","Paralegal","Compliance Analyst"],"IT":["IT Administrator","IT Support Specialist","Systems Engineer"],
 "Talent Acquisition":["Recruiter","Senior Recruiter","Recruiting Coordinator"],"People Ops":["HR Business Partner","People Ops Specialist","Payroll Specialist"],"Learning & Development":["L&D Specialist","Instructional Designer"]}

TOOLS = [ # name, cat, price, billing, usageData, usageLimit($), seats per dept, active per dept, usage per dept ($k), team weights
 ("ChatGPT Enterprise","Text & chat",45,"Per seat","Full",None,[300,120,200,120,60,60,40],[255,110,150,80,55,40,22],[0]*7,{}),
 ("Microsoft 365 Copilot","Text & chat",30,"Per seat","Full",None,[100,60,200,200,40,70,30],[60,40,120,110,25,55,15],[0]*7,{"Enterprise Sales":3,"Mid-Market Sales":3,"Customer Success":3,"Accounting":3,"FP&A":3}),
 ("Claude Enterprise","Text & chat",40,"Per seat","Full",None,[220,30,0,0,40,10,0],[205,26,0,0,36,6,0],[0]*7,{"Platform":3,"Payments":3,"Data Engineering":3,"Mobile":2,"Product Management":3,"Product Marketing":3,"Legal":4}),
# ("Synthesia","Video",65,"Seats + usage","Full",2000,[0,25,5,5,0,0,5],[0,22,3,4,0,0,4],[0,1.2,0.1,0.2,0,0,0.1],{"Content & Social":5,"Brand":3,"Enablement":2,"Learning & Development":5,"Customer Success":3,"Solutions Engineering":3}),  # removed 15 Nov 2026: no pay-per-use tools
# ("Runway","Video",35,"Seats + usage","Full",1800,[0,22,0,0,8,0,0],[0,20,0,0,7,0,0],[0,1.5,0,0,0.3,0,0],{"Content & Social":5,"Brand":4,"UX Design":3}),  # removed 15 Nov 2026: no pay-per-use tools
# ("ElevenLabs","Voice",22,"Seats + usage","Full",1500,[0,15,0,8,2,0,0],[0,14,0,8,2,0,0],[0,0.9,0,0.4,0.1,0,0],{"Content & Social":5,"Support Ops":5,"UX Research":3}),  # removed 15 Nov 2026: no pay-per-use tools
 ("Otter.ai","Voice",20,"Per seat","Full",None,[40,40,180,100,10,10,20],[20,30,140,60,6,8,12],[0]*7,{"Enterprise Sales":3,"Mid-Market Sales":3,"Customer Success":4,"Talent Acquisition":4,"UX Research":4}),
 ("Midjourney","Image",60,"Per seat","Invoice only",None,[0,35,0,0,15,0,0],None,[0]*7,{"Brand":5,"Content & Social":4,"UX Design":4}),
 ("Adobe Firefly","Image",30,"Per seat","Full",None,[0,60,10,0,40,0,10],[0,48,6,0,30,0,4],[0]*7,{"Brand":4,"Content & Social":4,"UX Design":4,"Design Systems":4}),
]
SHADOW = [ # name, cat, found, alt, monthly cost, per dept, team weights
 ("Perplexity","Text","Work-email sign-up","ChatGPT Enterprise",0,[12,18,25,6,9,4,2],{}),
 ("Fireflies.ai","Voice","Work calendar connected","Otter.ai",0,[3,6,22,5,2,1,3],{"Enterprise Sales":3,"Mid-Market Sales":3}),
 ("Claude Pro (personal plan)","Text","Expense claim","Claude Enterprise",20,[14,3,0,0,4,0,0],{"QA & Automation":3,"Infrastructure":3,"Security Engineering":2}),
 ("Leonardo.ai","Image","Work-email sign-up","Adobe Firefly",0,[0,9,0,0,5,0,0],{"Brand":3,"Content & Social":3}),
 ("DeepSeek","Text","Work-email sign-up","ChatGPT Enterprise (DeepSeek is blocked)",0,[9,2,1,0,1,0,0],{}),
 ("HeyGen","Video","Work-email sign-up","None approved yet",0,[0,7,2,0,1,0,1],{"Content & Social":4}),
 ("Suno","Voice","Expense claim","None approved yet",10,[0,4,0,0,0,0,0],{"Content & Social":4,"Events":3}),
]
ALERTS = [("Customer personal data",[2,5,9,6,0,1,0]),("Financial data",[0,1,2,0,0,5,1]),("Passwords & access keys",[5,0,0,0,1,0,0])]

# ---- locations pool
locs=[]
for n,c in LOC: locs += [n]*c
random.shuffle(locs)

emps=[]; used_emails=set()
def mkname(loc):
    f,l = NAMES[REG[loc]]
    return random.choice(f), random.choice(l)
def email(fn,ln):
    base=(fn+"."+ln).lower().replace(" ","").replace("'","")
    e=base; k=2
    while e in used_emails: e=f"{base}{k}"; k+=1
    used_emails.add(e); return e+"@acme.com"
def start_date(level):
    days=random.randint(30, 365*(9 if level in ("L1","L2","L3") else 6))
    return ASOF-dt.timedelta(days=days)

li=0
def nextloc():
    global li; l=locs[li]; li+=1; return l

# executives
def add(dept,team,title,level,mgr,loc=None):
    loc=loc or nextloc()
    fn,ln=mkname(loc)
    e=dict(id=f"ACM-{10001+len(emps)}",first=fn,last=ln,name=f"{fn} {ln}",email=email(fn,ln),dept=dept,team=team,title=title,level=level,mgr=mgr,loc=loc,start=start_date(level),status="Active",leave=None)
    emps.append(e); return len(emps)-1

ceo=add(5,"Office of the CEO","Chief Executive Officer","L1",None,"Bengaluru")
cfo=add(5,"FP&A","Chief Financial Officer","L2",ceo,"Bengaluru")
cto=add(0,"Platform","Chief Technology Officer","L2",ceo,"Bengaluru")
coo=add(3,"Support Ops","Chief Operating Officer","L2",ceo,"London")
head_parent={0:cto,1:ceo,2:ceo,3:coo,4:cto,5:cfo,6:coo}
for d,(dn,owner,b,hc,teams) in enumerate(DEPTS):
    existing=sum(1 for e in emps if e["dept"]==d)
    head=add(d,teams[0][0] if d!=5 else "FP&A",{"VP Engineering":"VP Engineering","Head of Marketing":"Head of Marketing","VP Sales":"VP Sales","Head of Support":"Head of Support","Head of Product":"Head of Product","Finance Controller":"Finance Controller","Head of HR":"Head of HR"}[owner],"L3",head_parent[d])
    for tn,tc in teams:
        have=sum(1 for e in emps if e["dept"]==d and e["team"]==tn)
        need=tc-have
        lead=add(d,tn,("Engineering Manager" if d==0 else "Manager, "+tn) if tn!="Office of the CEO" else "Chief of Staff","L4",head); need-=1
        sub=max(0,need//10-1)
        subleads=[lead]
        for _ in range(sub):
            subleads.append(add(d,tn,"Team Lead, "+tn,"L4",lead)); need-=1
        for _ in range(need):
            add(d,tn,random.choice(TITLES[tn]),"L5",random.choice(subleads))
assert len(emps)==2400,len(emps)
for d,(dn,_,_,hc,_) in enumerate(DEPTS):
    assert sum(1 for e in emps if e["dept"]==d)==hc,(dn,sum(1 for e in emps if e["dept"]==d))

# leavers: 18 L5s who left in Nov (status Left) - chosen among later seat holders
# ---- licences
lic=[]  # emp, tool, last_active(date or None), usage$
def pick(pool,n,weights):
    pool=list(pool); out=[]
    w=[weights.get(emps[i]["team"],1)*(1.6 if emps[i]["level"] in("L3","L4") else 1) for i in pool]
    for _ in range(n):
        tot=sum(w); r=random.uniform(0,tot); acc=0
        for j,x in enumerate(w):
            acc+=x
            if acc>=r: break
        out.append(pool.pop(j)); w.pop(j)
    return out
by_dept={d:[i for i,e in enumerate(emps) if e["dept"]==d] for d in range(7)}
for t,(tn,cat,price,bill,ud,lim,seats,active,usage,tw) in enumerate(TOOLS):
    for d in range(7):
        if not seats[d]: continue
        holders=pick(by_dept[d],seats[d],tw)
        if active is None:
            for h in holders: lic.append([h,t,None,0.0,"unknown"])
            continue
        act=set(random.sample(holders,active[d]))
        uw={h:random.lognormvariate(0,0.8) for h in act}
        tw_sum=sum(uw.values())
        for h in holders:
            if h in act:
                la=ASOF-dt.timedelta(days=int(min(29,random.expovariate(1/4))))
                u=round(usage[d]*1000*uw[h]/tw_sum,2) if usage[d] else 0.0
                lic.append([h,t,la,u,"active"])
            else:
                if random.random()<0.25: lic.append([h,t,None,0.0,"never"])
                else: lic.append([h,t,ASOF-dt.timedelta(days=random.randint(31,140)),0.0,"inactive"])
# fix rounding of usage to exact dept totals
for t,(tn,cat,price,bill,ud,lim,seats,active,usage,tw) in enumerate(TOOLS):
    for d in range(7):
        rows=[r for r in lic if r[1]==t and emps[r[0]]["dept"]==d and r[3]>0]
        if rows:
            diff=round(usage[d]*1000-sum(r[3] for r in rows),2); rows[0][3]=round(rows[0][3]+diff,2)

# leavers: L5 holders of inactive/never seats
holders_inactive=list({r[0] for r in lic if r[4] in("inactive","never") and emps[r[0]]["level"]=="L5"})
random.shuffle(holders_inactive)
for i in holders_inactive[:18]:
    emps[i]["status"]="Left"; emps[i]["leave"]=ASOF-dt.timedelta(days=random.randint(2,19))

# ---- shadow
shadow=[]
for s,(sn,cat,found,alt,cost,per,tw) in enumerate(SHADOW):
    for d in range(7):
        if per[d]:
            for h in pick([i for i in by_dept[d] if emps[i]["status"]=="Active"],per[d],tw):
                shadow.append([h,s,found,ASOF-dt.timedelta(days=random.randint(1,110)),cost])
# ---- alerts
CHAT={0,1,2}
alerts=[]
for a,(an,per) in enumerate(ALERTS):
    for d in range(7):
        cands=list({r[0] for r in lic if r[1] in CHAT and r[4]=="active" and emps[r[0]]["dept"]==d})
        for _ in range(per[d]):
            h=random.choice(cands)
            tools=[r[1] for r in lic if r[0]==h and r[1] in CHAT and r[4]=="active"]
            alerts.append([ASOF-dt.timedelta(days=random.randint(0,19)),h,random.choice(tools),a,random.choice(["Open","Open","Reviewed"])])
alerts.sort(key=lambda x:x[0],reverse=True)

# ---- checks
for t,T in enumerate(TOOLS):
    for d in range(7):
        n=sum(1 for r in lic if r[1]==t and emps[r[0]]["dept"]==d); assert n==T[6][d]
        if T[7]: assert sum(1 for r in lic if r[1]==t and emps[r[0]]["dept"]==d and r[4]=="active")==T[7][d]
print("employees",len(emps),"licences",len(lic),"shadow",len(shadow),"alerts",len(alerts))
print("leavers holding seats",sum(1 for e in emps if e["status"]=="Left"))

# ---- export JSON (compact)
ds=lambda x: x.isoformat() if x else None
J={"asOf":ASOF.isoformat(),"company":"Acme Corp",
 "depts":[{"name":d[0],"owner":d[1],"budget":d[2]*1000,"teams":[t[0] for t in d[4]]} for d in DEPTS],
 "locations":[l[0] for l in LOC],
 "tools":[{"name":t[0],"cat":t[1],"price":t[2],"billing":t[3],"usageData":t[4],"usageLimit":t[5]} for t in TOOLS],
 "shadowTools":[{"name":s[0],"cat":s[1],"found":s[2],"alt":s[3],"cost":s[4]} for s in SHADOW],
 "alertTypes":[a[0] for a in ALERTS],
 "emp":[[e["id"],e["name"],e["email"],e["dept"],[t[0] for t in DEPTS[e["dept"]][4]].index(e["team"]),e["title"],e["level"],e["mgr"] if e["mgr"] is not None else -1,[l[0] for l in LOC].index(e["loc"]),e["status"],ds(e["leave"]),ds(e["start"])] for e in emps],
 "lic":[[r[0],r[1],ds(r[2]),r[3],r[4]] for r in lic],
 "shadow":[[s[0],s[1],ds(s[3])] for s in shadow],
 "alerts":[[ds(a[0]),a[1],a[2],a[3],a[4]] for a in alerts]}
json.dump(J,open("src/data/acme_ai_governance.json","w"),separators=(",",":"))

# ---- CSVs
with open("data/csv/employees.csv","w",newline="") as f:
    w=csv.writer(f); w.writerow(["employee_id","name","email","department","team","title","level","manager_id","location","start_date","status","leave_date"])
    for e in emps: w.writerow([e["id"],e["name"],e["email"],DEPTS[e["dept"]][0],e["team"],e["title"],e["level"],emps[e["mgr"]]["id"] if e["mgr"] is not None else "",e["loc"],e["start"],e["status"],e["leave"] or ""])
with open("data/csv/ai_licences.csv","w",newline="") as f:
    w=csv.writer(f); w.writerow(["employee_id","tool","category","monthly_seat_cost_usd","usage_cost_mtd_usd","last_active","activity_status"])
    for r in lic:
        T=TOOLS[r[1]]; w.writerow([emps[r[0]]["id"],T[0],T[1],T[2],f"{r[3]:.2f}",r[2] or "",r[4]])
with open("data/csv/unauthorised_ai.csv","w",newline="") as f:
    w=csv.writer(f); w.writerow(["employee_id","department","tool","category","how_found","first_seen","monthly_cost_usd","approved_alternative"])
    for s in shadow:
        S=SHADOW[s[1]]; w.writerow([emps[s[0]]["id"],DEPTS[emps[s[0]]["dept"]][0],S[0],S[1],S[2],s[3],S[4],S[3]])
with open("data/csv/sensitive_data_alerts.csv","w",newline="") as f:
    w=csv.writer(f); w.writerow(["date","employee_id","department","tool","alert_type","status"])
    for a in alerts: w.writerow([a[0],emps[a[1]]["id"],DEPTS[emps[a[1]]["dept"]][0],TOOLS[a[2]][0],ALERTS[a[3]][0],a[4]])
with open("data/csv/department_budgets.csv","w",newline="") as f:
    w=csv.writer(f); w.writerow(["department","budget_owner","monthly_ai_budget_usd","headcount"])
    for d in DEPTS: w.writerow([d[0],d[1],d[2]*1000,d[3]])
