---
layout: archive
title: "Research Topics"
permalink: /research/
author_profile: false
---

{% include base_path %}

My research lies at the intersection of **optimization**, **machine learning**, and **scientific computing**. 
I am interested in designing theoretically grounded and computationally efficient algorithms for large-scale problems arising in data science, networked systems, and scientific modeling. 
Below are several major directions of my current and past work.

---

## Distributed Optimization Algorithms
Distributed optimization aims to solve large-scale problems collaboratively across multiple computing agents or data centers, with or without central coordination. 
My research explores both **centralized** and **decentralized** settings, emphasizing **communication-efficient** and **computation-efficient** algorithm design. 
I have developed several accelerated and provably convergent methods for decentralized gradient tracking, compressed communication, and directed network topologies—bridging theory and implementation in large-scale learning and signal processing systems.  

+ [Decentralized Consensus Algorithms](http://mingyan08.github.io/Slides/Decentralized.pdf):  
  This presentation introduces key topics including:
  * Non-accelerated algorithms: DGD, EXTRA/PG-EXTRA, NIDS  
  * Accelerated algorithms: OGT (Optimal Gradient Tracking), OPAPC  
  * Compressed communication: LEAD  
  * Directed graphs: APD (Accelerated Push-DIGing)
+ Selected Publications:
  - Z. Peng, Y. Xu, M. Yan, and W. Yin, [ARock: An algorithmic framework for asynchronous parallel coordinate updates](http://dx.doi.org/10.1137/15M1024950), *SIAM Journal on Scientific Computing*, 38 (2016), A2851-A2879. 
  - H. Tang, X. Lian, M. Yan, C. Zhang, and J. Liu, [D2: Decentralized training over decentralized data](http://proceedings.mlr.press/v80/tang18a.html), *ICML 2018*, 4848-4856.
  - Z. Li, W. Shi, and M. Yan, [A decentralized proximal-gradient method with network independent step-sizes and separated convergence rates](http://doi.org/10.1109/TSP.2019.2926022), *IEEE Transactions on Signal Processing*, 67 (2019), 4494-4506. ([Code](https://github.com/mingyan08/NIDS ))
  - X. Liu, Y. Li, R. Wang, J. Tang, and M. Yan, [Linear convergent decentralized optimization with compression](http://openreview.net/forum?id=84gjULz1t5), *ICLR 2021*. 
  - Z. Song, L. Shi, S. Pu, and M. Yan, [Provably accelerated decentralized gradient method over unbalanced directed graphs](https://doi.org/10.1137/22M148570X), *SIAM Journal on Optimization*, 34 (2024), 1131-1156.
  - Z. Song, L. Shi, S. Pu, and M. Yan, [Optimal gradient tracking for decentralized optimization](http://doi.org/10.1007/s10107-023-01997-7), *Mathematical Programming*, 207 (2024), 1-53.

---

## Physics-Informed Neural Networks (PINNs)
Physics-Informed Neural Networks (PINNs) integrate deep learning with physical laws to solve differential equations efficiently. 
My recent work improves accuracy and training efficiency through **novel network architectures** and **smoothness-regularized formulations**. 
This research bridges traditional numerical analysis and modern AI, enabling data-driven discovery and simulation of complex physical systems.

+ Selected Publications:
  - C. Si and M. Yan, [Initialization-enhanced physics-informed neural network with domain decomposition (IDPINN)](http://doi.org/10.1016/j.jcp.2025.113914), *Journal of Computational Physics*, 530 (2025), 113914.

---

## Primal–Dual Algorithms
Primal–dual splitting methods are fundamental tools for structured convex and nonconvex optimization. 
I proposed the **PD3O algorithm (Primal–Dual Three-Operator Splitting)**, which unifies and generalizes a family of primal–dual methods. 
My work further explores the **equivalence relationships** among various primal–dual frameworks, providing both mathematical insights and practical algorithms for imaging, inverse problems, and distributed learning.  

+ [Primal–Dual Algorithms](http://mingyan08.github.io/Slides/PD3O.pdf):  
  This presentation covers:
  * PD3O, Condat–Vu, AFBA, PDFP  
  * Chambolle–Pock, PAPC, FDFP2O

+ Selected Publications:
  - M. Yan, [A new primal-dual algorithm for minimizing the sum of three functions with a linear operator](http://doi.org/10.1007/s10915-018-0680-3), *Journal of Scientific Computing*, 76 (2018), 1698-1717. ([Code](https://github.com/mingyan08/PD3O))
  - M. Yan and Y. Li, [On the improved conditions for some primal-dual algorithms](http://doi.org/10.1007/s10915-024-02537-x), *Journal of Scientific Computing*, 99 (2024), 74.

---

## Sparse Optimization and Signal Processing
Sparse modeling provides a powerful framework for recovering signals and images from limited or corrupted data. 
My earlier research contributed advances in **nonconvex regularization**, **robust PCA**, and **low-rank matrix recovery**. 
These works combine optimization theory with practical algorithms for **image reconstruction**, **denoising**, and **compressive sensing**, leading to efficient solvers with provable recovery guarantees.

+ Selected Publications:
  - M. Yan, Y. Yang, and S. Osher, [Robust 1-bit compressive sensing using adaptive outlier pursuit](http://dx.doi.org/10.1109/TSP.2012.2193397), *IEEE Transactions on Signal Processing*, 60 (2012), 3868-3875. ([Code](http://github.com/mingyan08/aop))
  - M. Yan, [Restoration of images corrupted by impulse noise and mixed Gaussian impulse noise using blind inpainting](http://dx.doi.org/10.1137/12087178X), *SIAM Journal on Imaging Sciences*, 6 (2013), 1227-1245. 
  - Y. Lou and M. Yan, [Fast L1-L2 minimization via a proximal operator](http://dx.doi.org/10.1007/s10915-017-0463-2), *Journal of Scientific Computing*, 74 (2018), 767-785. ([Code](https://github.com/mingyan08/ProxL1-L2))
  - J. Liu, M. Yan, and T. Zeng, [Surface-aware blind image deblurring](http://doi.org/10.1109/TPAMI.2019.2941472), *IEEE Transactions on Pattern Analysis and Machine Intelligence*, 43 (2021), 1041-1055. 
  - Z. Li, M. Yan, T. Zeng, and G. Zhang, [Phase retrieval from incomplete data via weighted nuclear norm minimization](http://doi.org/10.1016/j.patcog.2022.108537), *Pattern Recognition*, 125 (2022), 108537.

---

## Artificial Intelligence for Mathematical and Optimization Problems
Artificial intelligence provides new perspectives for tackling mathematical and operations research challenges. 
I am broadly interested in leveraging machine learning—including **deep networks** and **reinforcement learning**—to design **adaptive, data-driven optimization algorithms** and **efficient solvers for inverse problems**.

---

_Last updated: {{ site.time | date: "%B %Y" }}_
