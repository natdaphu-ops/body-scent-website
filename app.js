const demoProducts = [
  {sku:"MOON-001",name:"Moon Moisture Shampoo",subtitle:"แชมพูสูตรเติมความชุ่มชื้น",description:"ช่วยทำความสะอาดเส้นผม พร้อมมอบสัมผัสนุ่มลื่น เหมาะสำหรับผมแห้ง",price:259,volume:"300 ml",type:"moisture"},
  {sku:"MOON-002",name:"Moon Anti-Hair Fall Shampoo",subtitle:"แชมพูสูตรดูแลผมขาดหลุดร่วง",description:"ทำความสะอาดหนังศีรษะอย่างอ่อนโยน พร้อมดูแลเส้นผมให้ดูแข็งแรง",price:289,volume:"300 ml",type:"fall"}
];
let products = [...demoProducts], cart = [];
const $ = s => document.querySelector(s);
const money = n => "฿" + Number(n).toLocaleString("th-TH");
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)}
function renderProducts(){
  $("#productGrid").innerHTML=products.map((p,i)=>`<article class="product-card">
    <div class="product-visual ${p.type==="fall"?"fall":"moisture"}"><img class="product-image" src="assets/${p.type==="fall"?"moon-anti-fall.svg":"moon-moisture.svg"}" alt="${p.name}"></div>
    <div class="product-info"><p class="eyebrow">${p.sku}</p><h3>${p.name}</h3><strong>${p.subtitle||""}</strong><p>${p.description||""} · ${p.volume||"300 ml"}</p>
    <div class="product-meta"><span class="price">${money(p.price)}</span><button class="add-btn" data-add="${i}">เพิ่มลงตะกร้า +</button></div></div></article>`).join("");
  document.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>addToCart(Number(b.dataset.add))));
  $("#productStatus").textContent=`${products.length} สูตรที่คัดสรรมาเพื่อคุณ`;
}
function addToCart(i){const p=products[i];const found=cart.find(x=>x.sku===p.sku);if(found)found.qty++;else cart.push({...p,qty:1});renderCart();toast("เพิ่มสินค้าลงตะกร้าแล้ว")}
function renderCart(){
  $("#cartCount").textContent=cart.reduce((s,x)=>s+x.qty,0);
  $("#cartItems").innerHTML=cart.length?cart.map((p,i)=>`<div class="cart-row"><div><strong>${p.name}</strong><small>${p.sku} · ${money(p.price)}</small></div><div class="qty-controls"><button data-minus="${i}">−</button><span>${p.qty}</span><button data-plus="${i}">+</button></div></div>`).join(""):'<p class="empty">ยังไม่มีสินค้าในตะกร้า</p>';
  $("#cartTotal").textContent=money(cart.reduce((s,x)=>s+x.price*x.qty,0));
  document.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>changeQty(+b.dataset.minus,-1));
  document.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>changeQty(+b.dataset.plus,1));
}
function changeQty(i,d){cart[i].qty+=d;if(cart[i].qty<=0)cart.splice(i,1);renderCart()}
function toggleCart(open){document.body.classList.toggle("cart-open",open)}
$("#cartToggle").onclick=()=>toggleCart(true);$("#cartClose").onclick=()=>toggleCart(false);$("#backdrop").onclick=()=>toggleCart(false);
function orderNo(){return "MH"+Date.now().toString().slice(-8)}
function showPacking(order,customer,phone,address){
  $("#packingOrderNo").textContent="เลขที่คำสั่งซื้อ: "+order;
  $("#packingRecipient").innerHTML=`<strong>ผู้รับ:</strong> ${escapeHtml(customer)}<br><strong>โทรศัพท์:</strong> ${escapeHtml(phone)}<br><strong>ที่อยู่:</strong> ${escapeHtml(address)}`;
  $("#packingLines").innerHTML=cart.map(p=>`<tr><td>${escapeHtml(p.name)}<br><small>${p.sku}</small></td><td>${p.qty}</td><td>${money(p.price*p.qty)}</td></tr>`).join("");
  $("#packingGrandTotal").textContent="รวมทั้งสิ้น "+money(cart.reduce((s,x)=>s+x.price*x.qty,0));
  $("#packingModal").classList.add("show");$("#packingModal").setAttribute("aria-hidden","false");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("#checkoutForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!cart.length){toast("กรุณาเลือกสินค้าก่อน");return}
  const form=new FormData(e.currentTarget), customer=form.get("customer").trim(),phone=form.get("phone").trim(),address=form.get("address").trim();
  const order=orderNo(),items=cart.map(p=>({sku:p.sku,name:p.name,qty:p.qty,price:p.price}));
  const payload={orderNo:order,customer,phone,address,items,total:cart.reduce((s,x)=>s+x.price*x.qty,0),createdAt:new Date().toISOString()};
  const btn=$("#orderButton");btn.disabled=true;btn.textContent="กำลังบันทึกคำสั่งซื้อ...";
  try{
    const url=window.MOON_CONFIG?.GOOGLE_SCRIPT_URL;
    if(url){await fetch(url,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});}
    showPacking(order,customer,phone,address);cart=[];renderCart();e.currentTarget.reset();toggleCart(false);
    toast(url?"บันทึกคำสั่งซื้อแล้ว":"สร้างใบจัดเตรียมตัวอย่างแล้ว");
  }catch(err){toast("ส่งข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง");}
  finally{btn.disabled=false;btn.textContent="ยืนยันคำสั่งซื้อ"}
});
$("#closePacking").onclick=()=>{$("#packingModal").classList.remove("show");$("#packingModal").setAttribute("aria-hidden","true")};
$("#printPacking").onclick=()=>window.print();
async function loadProducts(){
  const url=window.MOON_CONFIG?.GOOGLE_SCRIPT_URL;
  if(!url||window.MOON_CONFIG?.USE_DEMO_DATA){renderProducts();return}
  try{const r=await fetch(url);const data=await r.json();if(Array.isArray(data.products)&&data.products.length)products=data.products.map(p=>({...p,price:Number(p.price),type:String(p.type||"moisture")}));renderProducts()}
  catch(e){renderProducts();$("#productStatus").textContent="แสดงข้อมูลตัวอย่าง · ตรวจสอบการเชื่อมต่อ Google Sheets"}
}
loadProducts();renderCart();